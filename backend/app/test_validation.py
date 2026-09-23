import pytest
from pydantic import BaseModel, ValidationError

from app.validation import IsoDate, IsoDateOrEmpty, IsoDateTime


class _DateModel(BaseModel):
    d: IsoDate


class _DateOrEmptyModel(BaseModel):
    d: IsoDateOrEmpty


class _DateTimeModel(BaseModel):
    dt: IsoDateTime


@pytest.mark.parametrize("value", ["2026-07-30", "2026-01-01", "2026-12-31"])
def test_iso_date_accepts_valid_dates(value):
    assert _DateModel(d=value).d == value


@pytest.mark.parametrize(
    "value",
    [
        "July 30 2026",
        "07/30/2026",
        "2026/07/30",
        "30-07-2026",
        "2026-7-30",  # missing leading zero
        "2026-13-01",  # invalid month
        "2026-02-30",  # invalid day for February
        "not a date",
        "",
    ],
)
def test_iso_date_rejects_non_iso_input(value):
    with pytest.raises(ValidationError):
        _DateModel(d=value)


def test_iso_date_or_empty_allows_blank_string():
    assert _DateOrEmptyModel(d="").d == ""


def test_iso_date_or_empty_still_validates_non_blank_values():
    with pytest.raises(ValidationError):
        _DateOrEmptyModel(d="not a date")


@pytest.mark.parametrize(
    "value",
    [
        "2026-07-30T11:00:00+00:00",
        "2026-07-30T11:00:00Z",
        "2026-07-30T11:00:00.500+00:00",
        "2026-07-30T11:00:00",  # no offset - airport-local wall-clock time
        "2026-07-30T11:00:00-05:00",  # non-UTC offset
        "2026-07-30 11:00",  # space separator, as returned by search providers
    ],
)
def test_iso_datetime_accepts_any_iso_datetime_with_or_without_offset(value):
    assert _DateTimeModel(dt=value).dt == value


@pytest.mark.parametrize(
    "value",
    [
        "July 30 2026 11:00am",
        "2026-07-30",  # date only, no time
        "not a datetime",
    ],
)
def test_iso_datetime_rejects_non_iso_input(value):
    with pytest.raises(ValidationError):
        _DateTimeModel(dt=value)
