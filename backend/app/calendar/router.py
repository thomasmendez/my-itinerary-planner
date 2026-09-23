from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.calendar import service
from app.calendar.schemas import CalendarEntryResponse
from app.database import get_db
from app.trips import service as trips_service

router = APIRouter(tags=["calendar"])


@router.get("/api/trips/{trip_id}/calendar", response_model=list[CalendarEntryResponse])
def get_trip_calendar(trip_id: int, db: Session = Depends(get_db)):
    trips_service.get_trip_or_404(db, trip_id)
    return service.list_trip_entries(db, trip_id)


@router.get("/api/calendar", response_model=list[CalendarEntryResponse])
def get_aggregate_calendar(start: str | None = None, end: str | None = None, db: Session = Depends(get_db)):
    return service.list_entries(db, start, end)
