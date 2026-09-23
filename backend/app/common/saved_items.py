from typing import Any, Callable, TypeVar

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.calendar import service as calendar_service
from app.calendar.schemas import CalendarEntryInput
from app.common.enums import ItemStatus, SourceType
from app.trips import service as trips_service

ModelT = TypeVar("ModelT")
ResponseT = TypeVar("ResponseT", bound=BaseModel)


def get_or_404(db: Session, model: type[ModelT], trip_id: int, item_id: int, not_found_detail: str) -> ModelT:
    item = db.query(model).filter(model.trip_id == trip_id, model.id == item_id).first()  # type: ignore[attr-defined]
    if item is None:
        raise HTTPException(status_code=404, detail=not_found_detail)
    return item


def find_duplicate(db: Session, model: type[ModelT], trip_id: int, **fields: Any) -> ModelT | None:
    """Look for an already-saved item on this trip matching every field given."""
    query = db.query(model).filter(model.trip_id == trip_id)  # type: ignore[attr-defined]
    for field, value in fields.items():
        query = query.filter(getattr(model, field) == value)
    return query.first()


def find_overlap(
    db: Session,
    model: type[ModelT],
    trip_id: int,
    exclude_id: int,
    start_field: str,
    end_field: str,
    start: str,
    end: str,
    inclusive: bool = False,
) -> ModelT | None:
    """Find a confirmed item on this trip whose [start_field, end_field] window
    overlaps [start, end]. inclusive=True treats touching endpoints as an overlap
    (flights' departs/arrives instants); inclusive=False does not (hotels' back-to-back
    check-out/check-in dates are adjacent, not overlapping).
    """
    start_col = getattr(model, start_field)
    end_col = getattr(model, end_field)
    condition = (start_col <= end) & (end_col >= start) if inclusive else (start_col < end) & (end_col > start)
    return (
        db.query(model)
        .filter(model.trip_id == trip_id, model.status == "confirmed", model.id != exclude_id, condition)  # type: ignore[attr-defined]
        .first()
    )


def apply_custom_edit(
    db: Session,
    item: ModelT,
    edit_fields: dict[str, Any],
    trip_id: int,
    source_type: SourceType,
    calendar_entries_for: Callable[[ModelT], list[CalendarEntryInput]],
) -> None:
    """Applies a PATCH edit to a candidate custom item, then resyncs its calendar_entries
    (delete + recreate, still `candidate`) since the edit may have changed dates/location.
    Only candidate custom entries are editable - once confirmed, dates are locked in.
    """
    if item.source != "custom" or item.status != ItemStatus.CANDIDATE:
        raise HTTPException(status_code=400, detail="Only candidate custom entries can be edited")
    for field, value in edit_fields.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    calendar_service.delete_entries(db, source_type, item.id)  # type: ignore[attr-defined]
    calendar_service.create_entries(
        db, trip_id, ItemStatus.CANDIDATE, source_type, item.id, calendar_entries_for(item)
    )


def list_saved_items(db: Session, model: type[ModelT], trip_id: int, status: ItemStatus | None) -> list[ModelT]:
    """Shared GET-list body: trip lookup, optional status filter."""
    trips_service.get_trip_or_404(db, trip_id)
    query = db.query(model).filter(model.trip_id == trip_id)  # type: ignore[attr-defined]
    if status is not None:
        query = query.filter(model.status == status)  # type: ignore[attr-defined]
    return query.all()


def create_saved_item(
    db: Session,
    model: type[ModelT],
    trip_id: int,
    payload: BaseModel,
    source_type: SourceType,
    calendar_entries_fn: Callable[[ModelT], list[CalendarEntryInput]],
    *,
    duplicate_fields: dict[str, Any] | None = None,
    duplicate_label: str = "option",
) -> ModelT:
    """Shared POST body: trip lookup, optional duplicate check, insert as a
    candidate, then create its calendar_entries."""
    trips_service.get_trip_or_404(db, trip_id)

    if duplicate_fields is not None:
        existing = find_duplicate(db, model, trip_id, **duplicate_fields)
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail=f"Identical {duplicate_label} already saved (id={existing.id})",  # type: ignore[attr-defined]
            )

    item = model(trip_id=trip_id, status=ItemStatus.CANDIDATE, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)

    calendar_service.create_entries(
        db, trip_id, ItemStatus.CANDIDATE, source_type, item.id, calendar_entries_fn(item)  # type: ignore[attr-defined]
    )
    return item


def update_saved_item(
    db: Session,
    model: type[ModelT],
    trip_id: int,
    item_id: int,
    payload: Any,
    source_type: SourceType,
    not_found_detail: str,
    response_model: type[ResponseT],
    calendar_entries_for: Callable[[ModelT], list[CalendarEntryInput]],
    overlap_check: Callable[[ModelT], str | None] | None = None,
) -> ResponseT:
    """Shared PATCH body: trip/item lookup, optional candidate-custom-entry edit
    (see apply_custom_edit), optional overlap check when transitioning
    candidate -> confirmed, status flip, then confirm the item's calendar_entries in
    place. `payload` must expose a `status: ItemStatus | None` field plus whatever
    domain fields are editable.
    """
    trips_service.get_trip_or_404(db, trip_id)
    item = get_or_404(db, model, trip_id, item_id, not_found_detail)

    edit_fields = payload.model_dump(exclude={"status"}, exclude_unset=True)
    if edit_fields:
        apply_custom_edit(db, item, edit_fields, trip_id, source_type, calendar_entries_for)

    overlap_warning = None
    if payload.status is not None:
        if (
            overlap_check is not None
            and payload.status == ItemStatus.CONFIRMED
            and item.status != ItemStatus.CONFIRMED  # type: ignore[attr-defined]
        ):
            overlap_warning = overlap_check(item)

        item.status = payload.status  # type: ignore[attr-defined]
        db.commit()
        db.refresh(item)

        if payload.status == ItemStatus.CONFIRMED:
            calendar_service.confirm_entries(db, source_type, item.id)  # type: ignore[attr-defined]

    response = response_model.model_validate(item)
    response.overlap_warning = overlap_warning  # type: ignore[attr-defined]
    return response


def delete_saved_item(
    db: Session, model: type[ModelT], trip_id: int, item_id: int, source_type: SourceType, not_found_detail: str
) -> None:
    """Shared DELETE body: trip/item lookup, delete row, then delete all its
    calendar_entries regardless of status."""
    trips_service.get_trip_or_404(db, trip_id)
    item = get_or_404(db, model, trip_id, item_id, not_found_detail)
    db.delete(item)
    db.commit()
    calendar_service.delete_entries(db, source_type, item_id)  # type: ignore[attr-defined]
