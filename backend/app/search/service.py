import hashlib
import json
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from app.search.models import SearchCache

DEFAULT_TTL_HOURS = 6


def _hash_params(params: dict) -> str:
    canonical = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _ttl_hours() -> float:
    return float(os.environ.get("SEARCH_CACHE_TTL_HOURS", DEFAULT_TTL_HOURS))


def _live(row: SearchCache | None) -> SearchCache | None:
    """None if the row doesn't exist or its TTL has lapsed - shared so all three
    lookups below agree on what "cached" means."""
    if row is None or datetime.fromisoformat(row.expires_at) <= datetime.now(timezone.utc):
        return None
    return row


def get_cached(db: Session, provider: str, params: dict) -> dict | None:
    row = db.query(SearchCache).filter_by(provider=provider, params_hash=_hash_params(params)).one_or_none()
    row = _live(row)
    return row.response_json if row else None


def get_cache_id(db: Session, provider: str, params: dict) -> int | None:
    """Row id for a cache entry, so a caller can hand it back out as a stable pointer
    instead of re-transmitting the full response."""
    row = db.query(SearchCache).filter_by(provider=provider, params_hash=_hash_params(params)).one_or_none()
    row = _live(row)
    return row.id if row else None


def get_cached_by_id(db: Session, cache_id: int) -> dict | None:
    row = _live(db.get(SearchCache, cache_id))
    return row.response_json if row else None


def store(db: Session, provider: str, params: dict, response: dict) -> None:
    fetched_at = datetime.now(timezone.utc)
    expires_at = fetched_at + timedelta(hours=_ttl_hours())

    stmt = insert(SearchCache).values(
        provider=provider,
        params_hash=_hash_params(params),
        response_json=response,
        fetched_at=fetched_at.isoformat(),
        expires_at=expires_at.isoformat(),
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["provider", "params_hash"],
        set_={
            "response_json": stmt.excluded.response_json,
            "fetched_at": stmt.excluded.fetched_at,
            "expires_at": stmt.excluded.expires_at,
        },
    )
    db.execute(stmt)
    db.commit()
