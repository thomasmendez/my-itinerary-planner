import re
from datetime import date, datetime
from typing import Annotated

from pydantic import AfterValidator

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_iso_date(v: str) -> str:
    if not _DATE_RE.match(v):
        raise ValueError(f"must be an ISO-8601 date (YYYY-MM-DD), got {v!r}")
    try:
        date.fromisoformat(v)
    except ValueError as exc:
        raise ValueError(f"must be an ISO-8601 date (YYYY-MM-DD), got {v!r}") from exc
    return v


def _validate_iso_date_or_empty(v: str) -> str:
    return v if v == "" else _validate_iso_date(v)


def _validate_iso_datetime(v: str) -> str:
    # No offset required: flight timestamps hold the airport's local wall-clock
    # time as returned by search providers, not true UTC.
    if ":" not in v:
        raise ValueError(f"must be an ISO-8601 datetime, got {v!r}")
    try:
        datetime.fromisoformat(v)
    except ValueError as exc:
        raise ValueError(f"must be an ISO-8601 datetime, got {v!r}") from exc
    return v


def _validate_iso_datetime_or_date(v: str) -> str:
    # Events discovered via search routinely carry no time (see eventCandidate.ts).
    return _validate_iso_datetime(v) if ":" in v else _validate_iso_date(v)


IsoDate = Annotated[str, AfterValidator(_validate_iso_date)]
IsoDateOrEmpty = Annotated[str, AfterValidator(_validate_iso_date_or_empty)]
IsoDateTime = Annotated[str, AfterValidator(_validate_iso_datetime)]
IsoDateTimeOrDate = Annotated[str, AfterValidator(_validate_iso_datetime_or_date)]
