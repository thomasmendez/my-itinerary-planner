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
from app.hotels.models import SavedHotel
from app.hotels.schemas import SavedHotelCreate, SavedHotelPatch, SavedHotelResponse

SOURCE_TYPE = SourceType.SAVED_HOTEL
NOT_FOUND_DETAIL = "Saved hotel not found"

router = APIRouter(prefix="/api/trips/{trip_id}/hotels", tags=["saved-hotels"])


@router.get("", response_model=list[SavedHotelResponse])
def list_saved_hotels(trip_id: int, status: ItemStatus | None = None, db: Session = Depends(get_db)):
    return list_saved_items(db, SavedHotel, trip_id, status)


@router.post("", response_model=SavedHotelResponse, status_code=201)
def save_hotel(trip_id: int, payload: SavedHotelCreate, db: Session = Depends(get_db)):
    # Warn instead of duplicating an identical saved option.
    return create_saved_item(
        db,
        SavedHotel,
        trip_id,
        payload,
        SOURCE_TYPE,
        _calendar_entries_for,
        duplicate_fields={
            "name": payload.name,
            "price_per_night": payload.price_per_night,
            "check_in_date": payload.check_in_date,
            "check_out_date": payload.check_out_date,
        },
        duplicate_label="hotel option",
    )


@router.patch("/{hotel_id}", response_model=SavedHotelResponse)
def update_saved_hotel(trip_id: int, hotel_id: int, payload: SavedHotelPatch, db: Session = Depends(get_db)):
    def overlap_check(hotel: SavedHotel) -> str | None:
        # Non-blocking overlap warning when confirming a hotel whose stay window
        # overlaps an already-confirmed hotel on this trip. Back-to-back stays (one's
        # check-out day equals another's check-in day) are not an overlap.
        overlapping = find_overlap(
            db,
            SavedHotel,
            trip_id,
            hotel_id,
            start_field="check_in_date",
            end_field="check_out_date",
            start=hotel.check_in_date,
            end=hotel.check_out_date,
        )
        if overlapping is None:
            return None
        return (
            f"You already have a confirmed hotel ({overlapping.name}) "
            f"for overlapping dates (id={overlapping.id})"
        )

    return update_saved_item(
        db,
        SavedHotel,
        trip_id,
        hotel_id,
        payload,
        SOURCE_TYPE,
        NOT_FOUND_DETAIL,
        SavedHotelResponse,
        _calendar_entries_for,
        overlap_check,
    )


@router.delete("/{hotel_id}", status_code=204)
def delete_saved_hotel(trip_id: int, hotel_id: int, db: Session = Depends(get_db)):
    delete_saved_item(db, SavedHotel, trip_id, hotel_id, SOURCE_TYPE, NOT_FOUND_DETAIL)


def _calendar_entries_for(hotel: SavedHotel) -> list[CalendarEntryInput]:
    return [
        {
            "type": EntryType.HOTEL,
            "label": hotel.name,
            "starts_at": hotel.check_in_date,
            "ends_at": hotel.check_out_date,
        }
    ]
