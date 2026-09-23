from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.calendar.schemas import CalendarEntryInput
from app.common.enums import EntryType, ItemStatus, SourceType
from app.common.saved_items import create_saved_item, delete_saved_item, list_saved_items, update_saved_item
from app.database import get_db
from app.events.models import Event
from app.events.schemas import EventCreate, EventPatch, EventResponse

SOURCE_TYPE = SourceType.EVENT
NOT_FOUND_DETAIL = "Event not found"

router = APIRouter(prefix="/api/trips/{trip_id}/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_events(trip_id: int, status: ItemStatus | None = None, db: Session = Depends(get_db)):
    return list_saved_items(db, Event, trip_id, status)


@router.post("", response_model=EventResponse, status_code=201)
def save_event(trip_id: int, payload: EventCreate, db: Session = Depends(get_db)):
    return create_saved_item(
        db,
        Event,
        trip_id,
        payload,
        SOURCE_TYPE,
        _calendar_entries_for,
        duplicate_fields={
            "name": payload.name,
            "location": payload.location,
            "starts_at": payload.starts_at,
            "ends_at": payload.ends_at,
        },
        duplicate_label="event",
    )


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(trip_id: int, event_id: int, payload: EventPatch, db: Session = Depends(get_db)):
    def overlap_check(event: Event) -> str | None:
        # Coalesces a NULL ends_at to starts_at (discovered events
        # routinely have no end time) - unlike common/saved_items.find_overlap.
        overlapping = _find_overlapping_confirmed_event(
            db, trip_id, event_id, event.starts_at, event.ends_at or event.starts_at
        )
        if overlapping is None:
            return None
        return (
            f"You already have a confirmed event ({overlapping.name}) "
            f"for overlapping times (id={overlapping.id})"
        )

    return update_saved_item(
        db,
        Event,
        trip_id,
        event_id,
        payload,
        SOURCE_TYPE,
        NOT_FOUND_DETAIL,
        EventResponse,
        _calendar_entries_for,
        overlap_check,
    )


@router.delete("/{event_id}", status_code=204)
def delete_event(trip_id: int, event_id: int, db: Session = Depends(get_db)):
    delete_saved_item(db, Event, trip_id, event_id, SOURCE_TYPE, NOT_FOUND_DETAIL)


def _find_overlapping_confirmed_event(
    db: Session, trip_id: int, exclude_id: int, start: str, end: str
) -> Event | None:
    end_expr = func.coalesce(Event.ends_at, Event.starts_at)
    return (
        db.query(Event)
        .filter(
            Event.trip_id == trip_id,
            Event.status == ItemStatus.CONFIRMED,
            Event.id != exclude_id,
            Event.starts_at < end,
            end_expr > start,
        )
        .first()
    )


def _calendar_entries_for(event: Event) -> list[CalendarEntryInput]:
    return [
        {
            "type": EntryType.EVENT,
            "label": event.name,
            "starts_at": event.starts_at,
            "ends_at": event.ends_at or event.starts_at,
        }
    ]
