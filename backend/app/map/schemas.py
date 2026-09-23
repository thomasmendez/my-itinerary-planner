from pydantic import BaseModel

from app.common.enums import ItemStatus, SourceType


class MapPointResponse(BaseModel):
    source_type: SourceType
    source_id: int
    status: ItemStatus
    label: str
    location: str
    latitude: float | None
    longitude: float | None


class RoutePoint(BaseModel):
    latitude: float
    longitude: float


class RouteRequest(BaseModel):
    points: list[RoutePoint]
    profile: str = "driving-car"
