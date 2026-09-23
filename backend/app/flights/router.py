from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.calendar.schemas import CalendarEntryInput
from app.common.enums import EntryType, ItemStatus, SourceType
from app.common.saved_items import (
    create_saved_item,
    delete_saved_item,
    find_overlap,
    list_saved_items,
    update_saved_item,
)
from app.database import get_db
from app.flights.models import SavedFlight
from app.flights.schemas import SavedFlightCreate, SavedFlightPatch, SavedFlightResponse

SOURCE_TYPE = SourceType.SAVED_FLIGHT
NOT_FOUND_DETAIL = "Saved flight not found"

router = APIRouter(prefix="/api/trips/{trip_id}/flights", tags=["saved-flights"])


@router.get("", response_model=list[SavedFlightResponse])
def list_saved_flights(trip_id: int, status: ItemStatus | None = None, db: Session = Depends(get_db)):
    return list_saved_items(db, SavedFlight, trip_id, status)


@router.post("", response_model=SavedFlightResponse, status_code=201)
def save_flight(trip_id: int, payload: SavedFlightCreate, db: Session = Depends(get_db)):
    # Warn instead of duplicating an identical saved option.
    return create_saved_item(
        db,
        SavedFlight,
        trip_id,
        payload,
        SOURCE_TYPE,
        _calendar_entries_for,
        duplicate_fields={
            "airline": payload.airline,
            "price": payload.price,
            "outbound_departs_at": payload.outbound_departs_at,
            "return_departs_at": payload.return_departs_at,
        },
        duplicate_label="flight option",
    )


@router.patch("/{flight_id}", response_model=SavedFlightResponse)
def update_saved_flight(trip_id: int, flight_id: int, payload: SavedFlightPatch, db: Session = Depends(get_db)):
    def overlap_check(flight: SavedFlight) -> str | None:
        # Non-blocking overlap warning when confirming a flight whose outbound
        # window overlaps an already-confirmed flight on this trip.
        overlapping = find_overlap(
            db,
            SavedFlight,
            trip_id,
            flight_id,
            start_field="outbound_departs_at",
            end_field="outbound_arrives_at",
            start=flight.outbound_departs_at,
            end=flight.outbound_arrives_at,
            inclusive=True,
        )
        if overlapping is None:
            return None
        return (
            f"You already have a confirmed flight ({overlapping.airline}) "
            f"for overlapping dates (id={overlapping.id})"
        )

    return update_saved_item(
        db,
        SavedFlight,
        trip_id,
        flight_id,
        payload,
        SOURCE_TYPE,
        NOT_FOUND_DETAIL,
        SavedFlightResponse,
        _calendar_entries_for,
        overlap_check,
    )


@router.delete("/{flight_id}", status_code=204)
def delete_saved_flight(trip_id: int, flight_id: int, db: Session = Depends(get_db)):
    delete_saved_item(db, SavedFlight, trip_id, flight_id, SOURCE_TYPE, NOT_FOUND_DETAIL)


def _calendar_entries_for(flight: SavedFlight) -> list[CalendarEntryInput]:
    entries: list[CalendarEntryInput] = [
        {
            "type": EntryType.FLIGHT_DEPARTURE,
            "label": f"{flight.airline} {flight.origin} → {flight.destination}",
            "starts_at": flight.outbound_departs_at,
            "ends_at": flight.outbound_arrives_at,
        }
    ]
    if flight.return_departs_at is not None:
        # Guaranteed by SavedFlightCreate; assert just narrows the type for pyright.
        assert flight.return_arrives_at is not None
        entries.append(
            {
                "type": EntryType.FLIGHT_RETURN,
                "label": f"{flight.airline} {flight.destination} → {flight.origin}",
                "starts_at": flight.return_departs_at,
                "ends_at": flight.return_arrives_at,
            }
        )
    return entries
