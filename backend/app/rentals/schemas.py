from typing import Literal

from pydantic import BaseModel

from app.common.enums import ItemStatus
from app.common.schemas import SavedItemResponseBase
from app.validation import IsoDateTime


class SavedRentalCreate(BaseModel):
    # Rentals are custom-entry only - search is cut from scope - so this is
    # locked to "custom" rather than hotels'/flights' Literal["search", "custom"].
    source: Literal["custom"]
    description: str
    pickup_location: str
    pickup_at: IsoDateTime
    dropoff_at: IsoDateTime
    price: float | None = None
    raw_payload: dict


class SavedRentalPatch(BaseModel):
    status: ItemStatus | None = None
    # Edit fields below apply only to candidate entries (rentals are custom-only, see
    # common.saved_items.apply_custom_edit) - mirrors SavedRentalCreate minus `source`.
    description: str | None = None
    pickup_location: str | None = None
    pickup_at: IsoDateTime | None = None
    dropoff_at: IsoDateTime | None = None
    price: float | None = None
    raw_payload: dict | None = None


class SavedRentalResponse(SavedItemResponseBase):
    description: str
    pickup_location: str
    pickup_at: str
    dropoff_at: str
    price: float | None
