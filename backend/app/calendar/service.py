from sqlalchemy.orm import Session

from app.calendar.models import CalendarEntry
from app.calendar.schemas import CalendarEntryInput
from app.common.enums import ItemStatus, SourceType


def create_entries(
    db: Session,
    trip_id: int,
    status: ItemStatus,
    source_type: SourceType,
    source_id: int,
    entries: list[CalendarEntryInput],
) -> list[CalendarEntry]:
    """Create calendar_entries rows for a source item — one CalendarEntryInput per row."""
    created = [
        CalendarEntry(
            trip_id=trip_id,
            status=status,
            source_type=source_type,
            source_id=source_id,
            **entry,
        )
        for entry in entries
    ]
    db.add_all(created)
    db.commit()
    for entry in created:
        db.refresh(entry)
    return created


def confirm_entries(db: Session, source_type: SourceType, source_id: int) -> None:
    """Update existing entries' status to confirmed in place — never duplicated."""
    db.query(CalendarEntry).filter(
        CalendarEntry.source_type == source_type,
        CalendarEntry.source_id == source_id,
    ).update({"status": ItemStatus.CONFIRMED})
    db.commit()


def delete_entries(db: Session, source_type: SourceType, source_id: int) -> None:
    """Delete all entries for a source item, regardless of status."""
    db.query(CalendarEntry).filter(
        CalendarEntry.source_type == source_type,
        CalendarEntry.source_id == source_id,
    ).delete()
    db.commit()


def list_trip_entries(db: Session, trip_id: int) -> list[CalendarEntry]:
    return db.query(CalendarEntry).filter(CalendarEntry.trip_id == trip_id).all()


def list_entries(db: Session, start_date: str | None, end_date: str | None) -> list[CalendarEntry]:
    """All entries across trips, optionally filtered to a date range."""
    query = db.query(CalendarEntry)
    if start_date is not None:
        query = query.filter(CalendarEntry.starts_at >= start_date)
    if end_date is not None:
        query = query.filter(CalendarEntry.starts_at <= end_date)
    return query.all()
