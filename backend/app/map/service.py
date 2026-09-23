from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from app.common.enums import SourceType
from app.events.router import list_events
from app.flights.router import list_saved_flights
from app.hotels.router import list_saved_hotels
from app.map.adapters.iata import lookup as iata_lookup
from app.map.adapters.ors import geocode_location
from app.map.models import GeocodeCache
from app.map.schemas import MapPointResponse
from app.rentals.router import list_saved_rentals


def _normalize(query: str) -> str:
    return " ".join(query.split()).strip().lower()


def get_cached_coords(db: Session, query: str) -> tuple[float, float] | None:
    row = db.query(GeocodeCache).filter_by(query=_normalize(query)).one_or_none()
    return None if row is None else (row.latitude, row.longitude)


def store_coords(db: Session, query: str, latitude: float, longitude: float) -> None:
    stmt = insert(GeocodeCache).values(query=_normalize(query), latitude=latitude, longitude=longitude)
    stmt = stmt.on_conflict_do_update(
        index_elements=["query"], set_={"latitude": stmt.excluded.latitude, "longitude": stmt.excluded.longitude}
    )
    db.execute(stmt)
    db.commit()


def geocode(db: Session, query: str) -> tuple[float, float] | None:
    """Cache-through geocode: a cache hit skips the ORS geocode call entirely. An
    unresolvable query is not cached, so a later retry (e.g. after a typo'd address is
    corrected upstream) can still succeed."""
    cached = get_cached_coords(db, query)
    if cached is not None:
        return cached
    coords = geocode_location(query)
    if coords is None:
        return None
    store_coords(db, query, *coords)
    return coords


def _point(
    db: Session, source_type: SourceType, source_id: int, status: str, label: str, location: str
) -> MapPointResponse:
    coords = geocode(db, location) if location else None
    return MapPointResponse(
        source_type=source_type,
        source_id=source_id,
        status=status,
        label=label,
        location=location,
        latitude=coords[0] if coords else None,
        longitude=coords[1] if coords else None,
    )


def _flight_point(db: Session, flight_id: int, status: str, label: str, code: str) -> MapPointResponse:
    """Airport codes go through the bundled IATA lookup first (no network call, no cache
    entry needed) - only a code the dataset doesn't recognize falls back to ORS geocoding."""
    coords = iata_lookup(code)
    if coords is None:
        return _point(db, SourceType.SAVED_FLIGHT, flight_id, status, label, code)
    return MapPointResponse(
        source_type=SourceType.SAVED_FLIGHT,
        source_id=flight_id,
        status=status,
        label=label,
        location=code,
        latitude=coords[0],
        longitude=coords[1],
    )


def list_trip_points(db: Session, trip_id: int) -> list[MapPointResponse]:
    """Aggregates every saved item on a trip into geocoded map points, reusing each
    module's own list function rather than querying their tables directly."""
    points: list[MapPointResponse] = []

    for flight in list_saved_flights(trip_id, None, db=db):
        points.append(_flight_point(db, flight.id, flight.status, f"Departure: {flight.origin}", flight.origin))
        points.append(_flight_point(db, flight.id, flight.status, f"Arrival: {flight.destination}", flight.destination))

    for hotel in list_saved_hotels(trip_id, None, db=db):
        if hotel.latitude is not None and hotel.longitude is not None:
            points.append(
                MapPointResponse(
                    source_type=SourceType.SAVED_HOTEL,
                    source_id=hotel.id,
                    status=hotel.status,
                    label=hotel.name,
                    location=hotel.address or "",
                    latitude=hotel.latitude,
                    longitude=hotel.longitude,
                )
            )
        else:
            # A hotel's name (e.g. a custom lodging entry called "Friends House") is not a
            # location - geocoding it can match an unrelated real-world place of that name.
            # Only the address is a real location string; with none, skip geocoding entirely
            # and leave coordinates null rather than plot a guess.
            points.append(_point(db, SourceType.SAVED_HOTEL, hotel.id, hotel.status, hotel.name, hotel.address or ""))

    for rental in list_saved_rentals(trip_id, None, db=db):
        points.append(
            _point(db, SourceType.SAVED_RENTAL, rental.id, rental.status, rental.description, rental.pickup_location)
        )

    for event in list_events(trip_id, None, db=db):
        # An event with no location still belongs in the sidebar list (flagged with a
        # warning by the frontend) rather than being silently dropped from it.
        points.append(_point(db, SourceType.EVENT, event.id, event.status, event.name, event.location or ""))

    return points
