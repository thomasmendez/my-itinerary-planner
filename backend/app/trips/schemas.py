from pydantic import BaseModel, ConfigDict

from app.validation import IsoDate


class TripBase(BaseModel):
    name: str
    destinations: list[str] = []
    start_date: IsoDate | None = None
    end_date: IsoDate | None = None
    travelers: list[str] = []


class TripCreate(TripBase):
    pass


class TripPatch(BaseModel):
    name: str | None = None
    destinations: list[str] | None = None
    start_date: IsoDate | None = None
    end_date: IsoDate | None = None
    travelers: list[str] | None = None


class TripResponse(TripBase):
    id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
