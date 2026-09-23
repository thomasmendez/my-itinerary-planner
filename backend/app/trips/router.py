from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.trips import service
from app.trips.models import Trip
from app.trips.schemas import TripCreate, TripPatch, TripResponse

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.get("", response_model=list[TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(Trip).all()


@router.post("", response_model=TripResponse, status_code=201)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    trip = Trip(**payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    return service.get_trip_or_404(db, trip_id)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, payload: TripPatch, db: Session = Depends(get_db)):
    trip = service.get_trip_or_404(db, trip_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = service.get_trip_or_404(db, trip_id)
    db.delete(trip)
    db.commit()
