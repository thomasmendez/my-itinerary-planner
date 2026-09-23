from sqlalchemy.orm import Mapped, mapped_column

from app.common.models import SavedItemMixin
from app.database import Base


class Event(SavedItemMixin, Base):
    __tablename__: str = "events"

    name: Mapped[str] = mapped_column(nullable=False)
    location: Mapped[str | None] = mapped_column(nullable=True)
    starts_at: Mapped[str] = mapped_column(nullable=False)
    # Nullable: discovered events routinely carry no end time. The derived calendar
    # entry falls back to starts_at; the saved row keeps the true null.
    ends_at: Mapped[str | None] = mapped_column(nullable=True)
    price: Mapped[float | None] = mapped_column(nullable=True)
