import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.search import service as cache_service
from app.search.adapters.serpapi import (
    get_flight_booking_link,
    get_hotel_booking_link,
    get_return_flights,
    search_events,
    search_flights,
    search_hotels,
)
from app.search.adapters.serpapi_stub import SerpApiNotConfiguredError
from app.search.schemas import (
    EventSearchParams,
    FlightBookingLinkParams,
    FlightSearchParams,
    HotelBookingLinkParams,
    HotelSearchParams,
    ReturnFlightsParams,
)

router = APIRouter(prefix="/api/search", tags=["search"])

PROVIDER_FLIGHTS = "serpapi_flights"
PROVIDER_HOTELS = "serpapi_hotels"
PROVIDER_EVENTS = "serpapi_events"
PROVIDER_FLIGHTS_BOOKING_LINK = "serpapi_flights_booking_link"
PROVIDER_FLIGHTS_RETURN = "serpapi_flights_return"
PROVIDER_HOTELS_BOOKING_LINK = "serpapi_hotels_booking_link"


def _cached_call(db: Session, provider: str, params: dict, fn) -> dict:
    """Every search/booking-link route shares this shape: serve from search_cache
    if present, else call the SerpApi adapter and cache the result."""
    cached = cache_service.get_cached(db, provider, params)
    if cached is not None:
        return cached

    try:
        result = fn(params)
    except httpx.HTTPError as err:
        raise HTTPException(status_code=502, detail="SerpApi request failed") from err
    except SerpApiNotConfiguredError as err:
        raise HTTPException(status_code=503, detail=str(err)) from err

    cache_service.store(db, provider, params, result)
    return result


@router.post("/flights")
def search_flights_route(payload: FlightSearchParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_FLIGHTS, payload.model_dump(by_alias=True), search_flights)


@router.post("/flights/booking-link")
def flight_booking_link_route(payload: FlightBookingLinkParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_FLIGHTS_BOOKING_LINK, payload.model_dump(), get_flight_booking_link)


@router.post("/flights/return")
def flight_return_route(payload: ReturnFlightsParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_FLIGHTS_RETURN, payload.model_dump(), get_return_flights)


@router.post("/hotels")
def search_hotels_route(payload: HotelSearchParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_HOTELS, payload.model_dump(by_alias=True), search_hotels)


@router.post("/hotels/booking-link")
def hotel_booking_link_route(payload: HotelBookingLinkParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_HOTELS_BOOKING_LINK, payload.model_dump(), get_hotel_booking_link)


@router.post("/events")
def search_events_route(payload: EventSearchParams, db: Session = Depends(get_db)):
    return _cached_call(db, PROVIDER_EVENTS, payload.model_dump(by_alias=True), search_events)
