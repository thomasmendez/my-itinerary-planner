from pydantic import BaseModel, ConfigDict

from app.common.enums import ItemStatus


class SavedItemResponseBase(BaseModel):
    """Shared response fields across the saved_flights/saved_hotels/saved_rentals/events
    family. `overlap_warning` is only ever set on the PATCH-to-confirm response
    always null on GET/POST."""

    id: int
    trip_id: int
    status: ItemStatus
    source: str
    raw_payload: dict
    created_at: str
    overlap_warning: str | None = None

    model_config = ConfigDict(from_attributes=True)
