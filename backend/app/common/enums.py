from enum import Enum


class SourceType(str, Enum):
    """Which table owns this calendar entry."""

    SAVED_FLIGHT = "saved_flight"
    SAVED_RENTAL = "saved_rental"
    SAVED_HOTEL = "saved_hotel"
    EVENT = "event"


class EntryType(str, Enum):
    """The type of calendar entry."""

    FLIGHT_DEPARTURE = "flight_departure"
    FLIGHT_RETURN = "flight_return"
    RENTAL = "rental"
    HOTEL = "hotel"
    EVENT = "event"


class ItemStatus(str, Enum):
    CANDIDATE = "candidate"
    CONFIRMED = "confirmed"
