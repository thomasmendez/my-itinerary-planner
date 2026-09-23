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
from app.rentals.models import SavedRental
from app.rentals.schemas import SavedRentalCreate, SavedRentalPatch, SavedRentalResponse

SOURCE_TYPE = SourceType.SAVED_RENTAL
NOT_FOUND_DETAIL = "Saved rental not found"

router = APIRouter(prefix="/api/trips/{trip_id}/rentals", tags=["saved-rentals"])


@router.get("", response_model=list[SavedRentalResponse])
def list_saved_rentals(trip_id: int, status: ItemStatus | None = None, db: Session = Depends(get_db)):
    return list_saved_items(db, SavedRental, trip_id, status)


@router.post("", response_model=SavedRentalResponse, status_code=201)
def save_rental(trip_id: int, payload: SavedRentalCreate, db: Session = Depends(get_db)):
    # Keyed on pickup/dropoff window only - description/price aren't part
    # of "the same rental"'s identity.
    return create_saved_item(
        db,
        SavedRental,
        trip_id,
        payload,
        SOURCE_TYPE,
        _calendar_entries_for,
        duplicate_fields={
            "pickup_location": payload.pickup_location,
            "pickup_at": payload.pickup_at,
            "dropoff_at": payload.dropoff_at,
        },
        duplicate_label="rental option",
    )


@router.patch("/{rental_id}", response_model=SavedRentalResponse)
def update_saved_rental(trip_id: int, rental_id: int, payload: SavedRentalPatch, db: Session = Depends(get_db)):
    def overlap_check(rental: SavedRental) -> str | None:
        # Inclusive=False (default) - a dropoff equal to another rental's
        # pickup is a normal same-day handoff, not a conflict.
        overlapping = find_overlap(
            db,
            SavedRental,
            trip_id,
            rental_id,
            start_field="pickup_at",
            end_field="dropoff_at",
            start=rental.pickup_at,
            end=rental.dropoff_at,
        )
        if overlapping is None:
            return None
        return (
            f"You already have a confirmed rental ({overlapping.description}) "
            f"for overlapping times (id={overlapping.id})"
        )

    return update_saved_item(
        db,
        SavedRental,
        trip_id,
        rental_id,
        payload,
        SOURCE_TYPE,
        NOT_FOUND_DETAIL,
        SavedRentalResponse,
        _calendar_entries_for,
        overlap_check,
    )


@router.delete("/{rental_id}", status_code=204)
def delete_saved_rental(trip_id: int, rental_id: int, db: Session = Depends(get_db)):
    delete_saved_item(db, SavedRental, trip_id, rental_id, SOURCE_TYPE, NOT_FOUND_DETAIL)


def _calendar_entries_for(rental: SavedRental) -> list[CalendarEntryInput]:
    return [
        {
            "type": EntryType.RENTAL,
            "label": rental.description,
            "starts_at": rental.pickup_at,
            "ends_at": rental.dropoff_at,
        }
    ]
