from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, now_iso


class GeocodeCache(Base):
    """Caches a resolved (latitude, longitude) for a location string so repeat lookups
    skip the ORS geocode call. No TTL, unlike search_cache - a geocoded address doesn't go
    stale the way flight prices do """

    __tablename__: str = "geocode_cache"
    __table_args__ = (UniqueConstraint("query"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    query: Mapped[str] = mapped_column(nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=False)
    longitude: Mapped[float] = mapped_column(nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=False, default=now_iso)
