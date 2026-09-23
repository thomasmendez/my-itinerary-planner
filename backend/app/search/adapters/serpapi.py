import os
from datetime import date

import httpx

from app.search.adapters.serpapi_stub import (
    stub_booking_link_response,
    stub_events_response,
    stub_hotel_booking_link_response,
    stub_hotels_response,
    stub_response,
    stub_return_flights_response,
)

SERPAPI_URL = "https://serpapi.com/search"

def _month_day(iso_date: str) -> str:
    """'2026-10-01' -> 'October 1', for building a free-text event date query."""
    d = date.fromisoformat(iso_date)
    return f"{d.strftime('%B')} {d.day}"


def _event_dates(params: dict) -> str:
    """'Month Day' for one day, 'Month Day to Month Day' for a range, '' with no start date.
    An end date that's missing, equal to, or before the start date is ignored."""
    start, end = params.get("startDate"), params.get("endDate")
    if not start:
        return ""
    if end and date.fromisoformat(end) > date.fromisoformat(start):
        return f"{_month_day(start)} to {_month_day(end)}"
    return _month_day(start)


def _iata(params: dict, key: str) -> str:
    """Normalizes a user-entered airport code to the uppercase form SerpApi expects."""
    return str(params.get(key, "")).strip().upper()


def _serpapi_get(query: dict) -> dict:
    response = httpx.get(SERPAPI_URL, params=query, timeout=30)
    response.raise_for_status()
    return response.json()


def search_flights(params: dict) -> dict:
    """Calls SerpApi's google_flights engine and returns its response unmodified."""
    if not os.environ.get("SERPAPI_KEY"):
        return stub_response(params)

    query = {
        "engine": "google_flights",
        "departure_id": _iata(params, "from"),
        "arrival_id": _iata(params, "to"),
        "outbound_date": params.get("depart"),
        "currency": "USD",
        "type": "1" if params.get("return") else "2",
        "adults": str(params.get("travelers", 1)),
        # Always request the fuller result set, not just SerpApi's default "best" few.
        "show_hidden": "true",
        "api_key": os.environ["SERPAPI_KEY"],
    }
    if params.get("return"):
        query["return_date"] = params["return"]
    if params.get("travel_class", 1) != 1:
        query["travel_class"] = str(params["travel_class"])
    if params.get("sort_by", 1) != 1:
        query["sort_by"] = str(params["sort_by"])
    if params.get("stops", 0) != 0:
        query["stops"] = str(params["stops"])
    if params.get("max_price"):
        query["max_price"] = str(params["max_price"])

    return _serpapi_get(query)


def get_return_flights(params: dict) -> dict:
    """Round trip's second required SerpApi call: the initial google_flights search
    (type=1) only returns outbound legs, each carrying a departure_token - re-issuing
    the same route/dates with that token switches best_flights/other_flights over to
    the matching return-leg options."""
    if not os.environ.get("SERPAPI_KEY"):
        return stub_return_flights_response(params)

    query = {
        "engine": "google_flights",
        "departure_id": _iata(params, "departure_id"),
        "arrival_id": _iata(params, "arrival_id"),
        "outbound_date": params.get("outbound_date"),
        "return_date": params.get("return_date"),
        "currency": "USD",
        "type": "1",
        "departure_token": params.get("departure_token"),
        "show_hidden": "true",
        "api_key": os.environ["SERPAPI_KEY"],
    }

    return _serpapi_get(query)


def get_flight_booking_link(params: dict) -> dict:
    """Re-issues SerpApi's google_flights engine with a prior result's booking_token to
    get the cheapest booking_options entry's `url`/`post_data` (both None if none exist).

    `url` alone isn't a usable link - Google's redirector requires it POSTed with
    `post_data` (the frontend does that itself, DirectBookingLink.tsx, since it needs
    a real browser context); a bare GET 404s."""
    if not os.environ.get("SERPAPI_KEY"):
        return {"url": stub_booking_link_response(params), "post_data": None}

    query = {
        "engine": "google_flights",
        "departure_id": _iata(params, "departure_id"),
        "arrival_id": _iata(params, "arrival_id"),
        "outbound_date": params.get("outbound_date"),
        "currency": "USD",
        "type": params.get("type", "2"),
        "hl": "en",
        "booking_token": params.get("booking_token"),
        "api_key": os.environ["SERPAPI_KEY"],
    }
    if params.get("return_date"):
        query["return_date"] = params["return_date"]

    options = _serpapi_get(query).get("booking_options") or []
    if not options:
        return {"url": None, "post_data": None}
    booking_request = options[0].get("together", {}).get("booking_request", {})
    return {"url": booking_request.get("url"), "post_data": booking_request.get("post_data")}


def search_events(params: dict) -> dict:
    """Calls SerpApi's plain engine=google search and returns only events_results -
    engine=google_events was deprecated by SerpApi, so this is the replacement.

    q is built as "<event name> Events <Month Day>" for one day or
    "<event name> Events <Month Day> to <Month Day>" for a range (Google ignores numeric
    dates like 09-21); event name and dates are optional, so a location-only search sends
    q="Events". location is US-only: ", United States" is appended server-side."""
    if not os.environ.get("SERPAPI_KEY"):
        return stub_events_response(params)

    q_parts = [str(params.get("eventName") or "").strip(), "Events", _event_dates(params)]

    query = {
        "engine": "google",
        "q": " ".join(part for part in q_parts if part),
        "location": f"{params.get('location', '')}, United States",
        "google_domain": "google.com",
        "hl": "en",
        "gl": "us",
        "api_key": os.environ["SERPAPI_KEY"],
    }

    return {"events_results": _serpapi_get(query).get("events_results", [])}


def search_hotels(params: dict) -> dict:
    """Calls SerpApi's google_hotels engine and returns its response unmodified."""
    if not os.environ.get("SERPAPI_KEY"):
        return stub_hotels_response(params)

    query = {
        "engine": "google_hotels",
        "q": params.get("location", ""),
        "check_in_date": params.get("checkIn"),
        "check_out_date": params.get("checkOut"),
        "adults": str(params.get("guests", 1)),
        "currency": "USD",
        "gl": "us",
        "hl": "en",
        "api_key": os.environ["SERPAPI_KEY"],
    }
    if params.get("sort_by") is not None:
        query["sort_by"] = str(params["sort_by"])
    if params.get("min_price") is not None:
        query["min_price"] = str(params["min_price"])
    if params.get("max_price") is not None:
        query["max_price"] = str(params["max_price"])
    if params.get("rating") is not None:
        query["rating"] = str(params["rating"])

    return _serpapi_get(query)


def get_hotel_booking_link(params: dict) -> dict:
    """Re-issues SerpApi's google_hotels engine with a prior result's property_token to
    get that property's `link` and `address` - the search response has no per-property
    address, only this property-details call does.

    SerpApi requires `q` (the original search text) even though property_token already
    identifies the property - omitting it gets a 400."""
    if not os.environ.get("SERPAPI_KEY"):
        return stub_hotel_booking_link_response(params)

    query = {
        "engine": "google_hotels",
        "q": params.get("location", ""),
        "property_token": params.get("property_token"),
        "check_in_date": params.get("check_in_date"),
        "check_out_date": params.get("check_out_date"),
        "adults": str(params.get("adults", 1)),
        "currency": "USD",
        "gl": "us",
        "hl": "en",
        "api_key": os.environ["SERPAPI_KEY"],
    }

    data = _serpapi_get(query)
    return {"url": data.get("link"), "address": data.get("address")}
