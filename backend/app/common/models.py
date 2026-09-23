from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import ItemStatus
from app.database import now_iso


class SavedItemMixin:
    """Shared columns across the saved_flights/saved_hotels/saved_rentals/events family
    Domain fields are declared by each model."""

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(nullable=False, default=ItemStatus.CANDIDATE)
    source: Mapped[str] = mapped_column(nullable=False)
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=False, default=now_iso)
