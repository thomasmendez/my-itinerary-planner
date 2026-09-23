from typing import Literal

from pydantic import BaseModel

from app.common.enums import ItemStatus
from app.common.schemas import SavedItemResponseBase
from app.validation import IsoDate


class SavedHotelCreate(BaseModel):
    source: Literal["search", "custom"]
    name: str
    address: str | None = None
    check_in_date: IsoDate
    check_out_date: IsoDate
    price_per_night: float
    rating: float | None = None
    distance_km: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    raw_payload: dict


class SavedHotelPatch(BaseModel):
    status: ItemStatus | None = None
    # Edit fields below apply only to candidate custom entries (see
    # common.saved_items.apply_custom_edit) - mirrors SavedHotelCreate minus `source`.
    name: str | None = None
    address: str | None = None
    check_in_date: IsoDate | None = None
    check_out_date: IsoDate | None = None
    price_per_night: float | None = None
    rating: float | None = None
    distance_km: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    raw_payload: dict | None = None


class SavedHotelResponse(SavedItemResponseBase):
    name: str
    address: str | None
    check_in_date: str
    check_out_date: str
    price_per_night: float
    rating: float | None
    distance_km: float | None
    latitude: float | None
    longitude: float | None
