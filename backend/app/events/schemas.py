from typing import Literal

from pydantic import BaseModel

from app.common.enums import ItemStatus
from app.common.schemas import SavedItemResponseBase
from app.validation import IsoDateTimeOrDate


class EventCreate(BaseModel):
    source: Literal["search", "custom"]
    name: str
    location: str | None = None
    starts_at: IsoDateTimeOrDate
    ends_at: IsoDateTimeOrDate | None = None
    price: float | None = None
    raw_payload: dict


class EventPatch(BaseModel):
    status: ItemStatus | None = None
    # Edit fields below apply only to candidate custom entries
    # mirrors EventCreate minus `source`.
    name: str | None = None
    location: str | None = None
    starts_at: IsoDateTimeOrDate | None = None
    ends_at: IsoDateTimeOrDate | None = None
    price: float | None = None
    raw_payload: dict | None = None


class EventResponse(SavedItemResponseBase):
    name: str
    location: str | None
    starts_at: str
    ends_at: str | None
    price: float | None
