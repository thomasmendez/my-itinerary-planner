from typing import TypedDict

from pydantic import BaseModel, ConfigDict

from app.common.enums import EntryType, ItemStatus, SourceType


class CalendarEntryInput(TypedDict):
    type: EntryType
    label: str
    starts_at: str
    ends_at: str


class CalendarEntryResponse(BaseModel):
    id: int
    trip_id: int
    type: EntryType
    status: ItemStatus
    label: str
    starts_at: str
    ends_at: str
    source_type: SourceType
    source_id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
