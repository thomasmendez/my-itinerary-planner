from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.trips.models import Trip


def get_trip_or_404(db: Session, trip_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip
