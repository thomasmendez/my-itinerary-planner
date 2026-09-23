from typing import Literal, Self

from pydantic import BaseModel, model_validator

from app.common.enums import ItemStatus
from app.common.schemas import SavedItemResponseBase
from app.validation import IsoDateTime


class SavedFlightCreate(BaseModel):
    source: Literal["search", "custom"]
    origin: str
    destination: str
    outbound_departs_at: IsoDateTime
    outbound_arrives_at: IsoDateTime
    return_departs_at: IsoDateTime | None = None
    return_arrives_at: IsoDateTime | None = None
    airline: str
    price: float
    duration_minutes: int
    stops: int
    raw_payload: dict

    @model_validator(mode="after")
    def _return_leg_is_all_or_nothing(self) -> Self:
        # One-way flights omit both; round trips need both to build the
        # flight_return calendar entry (calendar_entries.ends_at is NOT NULL).
        if (self.return_departs_at is None) != (self.return_arrives_at is None):
            raise ValueError(
                "return_departs_at and return_arrives_at must both be set or both omitted"
            )
        return self


class SavedFlightPatch(BaseModel):
    status: ItemStatus | None = None
    # Edit fields below apply only to candidate custom entries
    # mirrors SavedFlightCreate minus `source`.
    origin: str | None = None
    destination: str | None = None
    outbound_departs_at: IsoDateTime | None = None
    outbound_arrives_at: IsoDateTime | None = None
    return_departs_at: IsoDateTime | None = None
    return_arrives_at: IsoDateTime | None = None
    airline: str | None = None
    price: float | None = None
    duration_minutes: int | None = None
    stops: int | None = None
    raw_payload: dict | None = None


class SavedFlightResponse(SavedItemResponseBase):
    origin: str
    destination: str
    outbound_departs_at: str
    outbound_arrives_at: str
    return_departs_at: str | None
    return_arrives_at: str | None
    airline: str
    price: float
    duration_minutes: int
    stops: int
