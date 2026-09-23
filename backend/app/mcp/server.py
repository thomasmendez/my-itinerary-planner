import re
from contextlib import contextmanager
from datetime import date

from fastapi import HTTPException
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

from app.calendar.router import get_aggregate_calendar as _get_aggregate_calendar
from app.calendar.router import get_trip_calendar as _get_trip_calendar
from app.calendar.schemas import CalendarEntryResponse
from app.database import SessionLocal
from app.events.router import delete_event as _delete_event
from app.events.router import list_events as _list_events
from app.events.router import save_event as _save_event
from app.events.schemas import EventCreate, EventResponse
from app.flights.router import delete_saved_flight as _delete_saved_flight
from app.flights.router import list_saved_flights as _list_saved_flights
from app.flights.router import save_flight as _save_flight
from app.flights.schemas import SavedFlightCreate, SavedFlightResponse
from app.hotels.router import delete_saved_hotel as _delete_saved_hotel
from app.hotels.router import list_saved_hotels as _list_saved_hotels
from app.hotels.router import save_hotel as _save_hotel
from app.hotels.schemas import SavedHotelCreate, SavedHotelResponse
from app.search import service as _search_cache
from app.search.router import PROVIDER_EVENTS, PROVIDER_FLIGHTS, PROVIDER_HOTELS
from app.search.router import search_events_route as _search_events
from app.search.router import search_flights_route as _search_flights
from app.search.router import search_hotels_route as _search_hotels
from app.search.schemas import EventSearchParams, FlightSearchParams, HotelSearchParams
from app.trips.router import create_trip as _create_trip
from app.trips.router import delete_trip as _delete_trip
from app.trips.router import get_trip as _get_trip
from app.trips.router import list_trips as _list_trips
from app.trips.router import update_trip as _update_trip
from app.trips.schemas import TripCreate, TripPatch, TripResponse

mcp_server = MCPServer(
    name="itinerary-planner",
    instructions=(
        "Manage trips, search flights and hotels and manage their candidates, and "
        "read calendar entries. Confirming a candidate (locking it in) is done by "
        "the human in the app UI and is not available here. There is no car rental "
        "search tool - rentals are custom-entry only - so if asked about rentals, say "
        'so and point the user to the "+ Add custom vehicle" form in the Rentals '
        "tab, which records a rental manually rather than searching for one."
    ),
)


@contextmanager
def _db():
    db = SessionLocal()
    try:
        yield db
    except HTTPException as exc:
        # ToolError is the one exception type whose text reaches the agent - an
        # uncaught HTTPException gets swallowed into a generic error message.
        raise ToolError(exc.detail) from exc
    finally:
        db.close()


@mcp_server.tool()
def list_trips() -> list[dict]:
    """List all trips, including their id, dates, and destinations."""
    with _db() as db:
        return [TripResponse.model_validate(t).model_dump() for t in _list_trips(db=db)]


@mcp_server.tool()
def get_trip(trip_id: int) -> dict:
    """Get one trip's details (dates, destinations, travelers) by id."""
    with _db() as db:
        return TripResponse.model_validate(_get_trip(trip_id, db=db)).model_dump()


@mcp_server.tool()
def create_trip(
    name: str,
    destinations: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    travelers: list[str] | None = None,
) -> dict:
    """Create a new trip to plan flights against. Only `name` is required - call
    this with just a name rather than asking the user for dates/destinations/travelers
    up front; those can be added later with update_trip."""
    payload = TripCreate(
        name=name,
        destinations=destinations or [],
        start_date=start_date,
        end_date=end_date,
        travelers=travelers or [],
    )
    with _db() as db:
        return TripResponse.model_validate(_create_trip(payload, db=db)).model_dump()


@mcp_server.tool()
def update_trip(
    trip_id: int,
    name: str | None = None,
    destinations: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    travelers: list[str] | None = None,
) -> dict:
    """Update a trip's fields. Only the fields you pass are changed."""
    fields = {
        "name": name,
        "destinations": destinations,
        "start_date": start_date,
        "end_date": end_date,
        "travelers": travelers,
    }
    payload = TripPatch(**{k: v for k, v in fields.items() if v is not None})
    with _db() as db:
        return TripResponse.model_validate(_update_trip(trip_id, payload, db=db)).model_dump()


@mcp_server.tool()
def delete_trip(trip_id: int) -> dict:
    """Delete a trip and everything under it (saved flights, calendar entries, etc.)."""
    with _db() as db:
        _delete_trip(trip_id, db=db)
    return {"removed": True, "trip_id": trip_id}


def _get_cached_result(db, cache_id: int, result_index: int, results_from_envelope) -> dict:
    """Shared by every save_*_candidate tool: look up the cached search envelope by
    cache_id, pull out its results list, and bounds-check result_index."""
    envelope = _search_cache.get_cached_by_id(db, cache_id)
    if envelope is None:
        raise ToolError(f"No search results for cache_id {cache_id} (expired or never existed) - search again")
    results = results_from_envelope(envelope)
    if not 0 <= result_index < len(results):
        raise ToolError(f"result_index {result_index} out of range (0-{len(results) - 1})")
    return envelope, results[result_index]


def _flight_results(envelope: dict) -> list[dict]:
    return envelope.get("best_flights", []) + envelope.get("other_flights", [])


def _summarize_flight(index: int, entry: dict) -> dict:
    """Everything an agent needs to compare/pick a flight - no nested legs, extensions,
    logos, or booking tokens. Keeps search_flights' response small so the model reasons
    over a handful of scalar fields instead of copying huge objects around."""
    legs = entry.get("flights", [])
    first_leg = legs[0] if legs else {}
    last_leg = legs[-1] if legs else {}
    return {
        "result_index": index,
        "airline": first_leg.get("airline"),
        "origin": first_leg.get("departure_airport", {}).get("id"),
        "destination": last_leg.get("arrival_airport", {}).get("id"),
        "outbound_departs_at": first_leg.get("departure_airport", {}).get("time"),
        "outbound_arrives_at": last_leg.get("arrival_airport", {}).get("time"),
        "price": entry.get("price"),
        "duration_minutes": entry.get("total_duration"),
        "stops": max(len(legs) - 1, 0),
    }


def _flight_fields_from_result(entry: dict) -> dict:
    summary = _summarize_flight(0, entry)
    del summary["result_index"]
    # round-trip legs aren't in this entry shape (SerpApi needs a second,
    # token-based call for the return leg, not implemented) - always saved as one-way.
    return {**summary, "return_departs_at": None, "return_arrives_at": None, "raw_payload": entry}


@mcp_server.tool()
def search_flights(from_: str, to: str, depart: str, return_: str = "", travelers: int = 1) -> dict:
    """Search flights (one-way unless return_ given). Dates: YYYY-MM-DD. Returns a
    cache_id plus summarized results (price, airline, times, stops). Save one via
    save_flight_candidate(cache_id, result_index) - don't copy fields by hand."""
    payload = FlightSearchParams(from_=from_, to=to, depart=depart, return_=return_, travelers=travelers)
    with _db() as db:
        envelope = _search_flights(payload, db=db)
        cache_id = _search_cache.get_cache_id(db, PROVIDER_FLIGHTS, payload.model_dump(by_alias=True))
        results = _flight_results(envelope)
        return {
            "cache_id": cache_id,
            "results": [_summarize_flight(i, entry) for i, entry in enumerate(results)],
        }


@mcp_server.tool()
def save_flight_candidate(trip_id: int, cache_id: int, result_index: int) -> dict:
    """Save a search_flights result as a candidate (status always "candidate" - the
    human confirms later in the UI). Use the exact cache_id/result_index search_flights
    returned."""
    with _db() as db:
        _, result = _get_cached_result(db, cache_id, result_index, _flight_results)
        payload = SavedFlightCreate(source="search", **_flight_fields_from_result(result))
        flight = _save_flight(trip_id, payload, db=db)
        return SavedFlightResponse.model_validate(flight).model_dump()


@mcp_server.tool()
def list_saved_flights(trip_id: int, status: str | None = None) -> list[dict]:
    """List saved flights for a trip, optionally filtered by status ("candidate" | "confirmed")."""
    with _db() as db:
        flights = _list_saved_flights(trip_id, status, db=db)
        return [SavedFlightResponse.model_validate(f).model_dump() for f in flights]


@mcp_server.tool()
def remove_saved_flight(trip_id: int, flight_id: int) -> dict:
    """Remove a saved flight and its calendar entries."""
    with _db() as db:
        _delete_saved_flight(trip_id, flight_id, db=db)
    return {"removed": True, "trip_id": trip_id, "flight_id": flight_id}


def _hotel_results(envelope: dict) -> list[dict]:
    return envelope.get("properties", [])


def _summarize_hotel(index: int, entry: dict) -> dict:
    """Just what an agent needs to compare/pick a hotel - no amenities, images, or
    booking links. Keeps search_hotels' response small, same reasoning as
    _summarize_flight."""
    return {
        "result_index": index,
        "name": entry.get("name"),
        "price_per_night": entry.get("rate_per_night", {}).get("extracted_lowest"),
        "rating": entry.get("overall_rating"),
    }


def _hotel_fields_from_result(entry: dict, location: str, check_in_date: str, check_out_date: str) -> dict:
    summary = _summarize_hotel(0, entry)
    del summary["result_index"]
    gps = entry.get("gps_coordinates", {})
    # raw_payload must match frontend's SearchHotelOption shape (types/hotels.ts) -
    # toHotelCandidate reads source/location/check_in_date/check_out_date straight off
    # it, none of which the raw SerpApi entry carries (caused undefined dates/NaN spend).
    raw_payload = {
        **entry,
        "source": "search",
        "location": location,
        "check_in_date": check_in_date,
        "check_out_date": check_out_date,
    }
    return {
        **summary,
        "address": None,
        "distance_km": None,
        "latitude": gps.get("latitude"),
        "longitude": gps.get("longitude"),
        "check_in_date": check_in_date,
        "check_out_date": check_out_date,
        "raw_payload": raw_payload,
    }


@mcp_server.tool()
def search_hotels(location: str, check_in: str, check_out: str, guests: int = 1) -> dict:
    """Search hotels. Dates: YYYY-MM-DD. Returns a cache_id plus summarized results
    (name, price/night, rating). Save one via save_hotel_candidate(cache_id,
    result_index) - don't copy fields by hand."""
    payload = HotelSearchParams(location=location, check_in=check_in, check_out=check_out, guests=guests)
    with _db() as db:
        envelope = _search_hotels(payload, db=db)
        cache_id = _search_cache.get_cache_id(db, PROVIDER_HOTELS, payload.model_dump(by_alias=True))
        results = _hotel_results(envelope)
        return {
            "cache_id": cache_id,
            "results": [_summarize_hotel(i, entry) for i, entry in enumerate(results)],
        }


@mcp_server.tool()
def save_hotel_candidate(trip_id: int, cache_id: int, result_index: int) -> dict:
    """Save a search_hotels result as a candidate (status always "candidate" - the
    human confirms later in the UI). Use the exact cache_id/result_index search_hotels
    returned; stay dates are looked up server-side too."""
    with _db() as db:
        envelope, result = _get_cached_result(db, cache_id, result_index, _hotel_results)
        params = envelope.get("search_parameters", {})
        fields = _hotel_fields_from_result(
            result, params.get("q"), params.get("check_in_date"), params.get("check_out_date")
        )
        payload = SavedHotelCreate(source="search", **fields)
        hotel = _save_hotel(trip_id, payload, db=db)
        return SavedHotelResponse.model_validate(hotel).model_dump()


@mcp_server.tool()
def list_saved_hotels(trip_id: int, status: str | None = None) -> list[dict]:
    """List saved hotels for a trip, optionally filtered by status ("candidate" | "confirmed")."""
    with _db() as db:
        hotels = _list_saved_hotels(trip_id, status, db=db)
        return [SavedHotelResponse.model_validate(h).model_dump() for h in hotels]


@mcp_server.tool()
def remove_saved_hotel(trip_id: int, hotel_id: int) -> dict:
    """Remove a saved hotel and its calendar entries."""
    with _db() as db:
        _delete_saved_hotel(trip_id, hotel_id, db=db)
    return {"removed": True, "trip_id": trip_id, "hotel_id": hotel_id}


def _event_results(envelope: dict) -> list[dict]:
    return envelope.get("events_results", [])


def _summarize_event(index: int, entry: dict) -> dict:
    address = entry.get("address") or []
    return {
        "result_index": index,
        "title": entry.get("title"),
        "type": entry.get("type"),
        "date": entry.get("date"),
        "time": entry.get("time"),
        "address": ", ".join(address) or None,
    }


_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _parse_serpapi_event_date(date_str: str, time_str: str | None) -> tuple[str, None]:
    """Port of frontend/src/lib/time.ts's parseSerpApiEventDate - SerpApi's events_results
    gives free-text "Oct 1" + optional "3:00 PM" with no year, rolled forward to the next
    occurrence relative to today. Falls back to the raw string unparsed, same as the
    frontend"""
    match = re.match(r"^([A-Za-z]{3})\s+(\d{1,2})$", date_str.strip())
    month = _MONTHS.index(match.group(1)) if match and match.group(1) in _MONTHS else -1
    if not match or month == -1:
        return date_str, None

    day = int(match.group(2))
    today = date.today()
    year = today.year
    try:
        candidate = date(year, month + 1, day)
    except ValueError:
        return date_str, None
    if candidate < today:
        year += 1
        candidate = date(year, month + 1, day)
    iso_date = candidate.isoformat()

    time_match = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", (time_str or "").strip(), re.IGNORECASE)
    if not time_match:
        return iso_date, None
    hour = int(time_match.group(1)) % 12
    if time_match.group(3).upper() == "PM":
        hour += 12
    return f"{iso_date} {hour:02d}:{time_match.group(2)}", None


def _event_fields_from_result(entry: dict) -> dict:
    starts_at, ends_at = _parse_serpapi_event_date(entry.get("date", ""), entry.get("time"))
    address = entry.get("address") or []
    return {
        "name": entry.get("title"),
        "location": ", ".join(address) or None,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "price": None,
        "raw_payload": entry,
    }


@mcp_server.tool()
def search_events(location: str, event_name: str = "", start_date: str = "", end_date: str = "") -> dict:
    """Search local events. Only location is required: US city/state (e.g. "Austin,
    Texas"). event_name (e.g. "Networking") and dates (YYYY-MM-DD; start_date alone
    is a single-day search, add end_date for a range) are optional - omit them for a general search.
    Returns a cache_id plus summarized results (title, type, date, time, address - no
    price or id). Save one via save_event_candidate(cache_id, result_index)."""
    payload = EventSearchParams(event_name=event_name, location=location, start_date=start_date, end_date=end_date)
    with _db() as db:
        envelope = _search_events(payload, db=db)
        cache_id = _search_cache.get_cache_id(db, PROVIDER_EVENTS, payload.model_dump(by_alias=True))
        results = _event_results(envelope)
        return {
            "cache_id": cache_id,
            "results": [_summarize_event(i, entry) for i, entry in enumerate(results)],
        }


@mcp_server.tool()
def save_event_candidate(trip_id: int, cache_id: int, result_index: int) -> dict:
    """Save a search_events result as a candidate (status always "candidate" - the
    human confirms later in the UI). Use the exact cache_id/result_index search_events
    returned; free-text date/time is converted to ISO server-side."""
    with _db() as db:
        _, result = _get_cached_result(db, cache_id, result_index, _event_results)
        payload = EventCreate(source="search", **_event_fields_from_result(result))
        event = _save_event(trip_id, payload, db=db)
        return EventResponse.model_validate(event).model_dump()


@mcp_server.tool()
def list_events(trip_id: int, status: str | None = None) -> list[dict]:
    """List events for a trip, optionally filtered by status ("candidate" | "confirmed")."""
    with _db() as db:
        events = _list_events(trip_id, status, db=db)
        return [EventResponse.model_validate(e).model_dump() for e in events]


@mcp_server.tool()
def remove_event(trip_id: int, event_id: int) -> dict:
    """Remove an event and its calendar entries."""
    with _db() as db:
        _delete_event(trip_id, event_id, db=db)
    return {"removed": True, "trip_id": trip_id, "event_id": event_id}


@mcp_server.tool()
def get_trip_calendar(trip_id: int) -> list[dict]:
    """Get all calendar entries (flights, hotels, events, ...) for one trip."""
    with _db() as db:
        entries = _get_trip_calendar(trip_id, db=db)
        return [CalendarEntryResponse.model_validate(e).model_dump() for e in entries]


@mcp_server.tool()
def get_calendar(start: str | None = None, end: str | None = None) -> list[dict]:
    """Get calendar entries across all trips, optionally filtered to a date range
    (start/end are YYYY-MM-DD)."""
    with _db() as db:
        entries = _get_aggregate_calendar(start, end, db=db)
        return [CalendarEntryResponse.model_validate(e).model_dump() for e in entries]
