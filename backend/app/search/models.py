from sqlalchemy import JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SearchCache(Base):
    """Caches a provider's search response so repeat searches skip the external API call."""

    __tablename__: str = "search_cache"
    __table_args__ = (UniqueConstraint("provider", "params_hash"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(nullable=False)
    params_hash: Mapped[str] = mapped_column(nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    fetched_at: Mapped[str] = mapped_column(nullable=False)
    expires_at: Mapped[str] = mapped_column(nullable=False)
