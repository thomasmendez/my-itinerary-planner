from sqlalchemy.orm import Mapped, mapped_column

from app.common.models import SavedItemMixin
from app.database import Base


class SavedFlight(SavedItemMixin, Base):
    __tablename__: str = "saved_flights"

    origin: Mapped[str] = mapped_column(nullable=False)
    destination: Mapped[str] = mapped_column(nullable=False)
    outbound_departs_at: Mapped[str] = mapped_column(nullable=False)
    outbound_arrives_at: Mapped[str] = mapped_column(nullable=False)
    return_departs_at: Mapped[str | None] = mapped_column(nullable=True)
    return_arrives_at: Mapped[str | None] = mapped_column(nullable=True)
    airline: Mapped[str] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    stops: Mapped[int] = mapped_column(nullable=False)
