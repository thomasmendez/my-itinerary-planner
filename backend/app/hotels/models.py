from sqlalchemy.orm import Mapped, mapped_column

from app.common.models import SavedItemMixin
from app.database import Base


class SavedHotel(SavedItemMixin, Base):
    __tablename__: str = "saved_hotels"

    name: Mapped[str] = mapped_column(nullable=False)
    # Nullable: SerpApi's google_hotels search response has no per-property address
    # field; a real address is only resolved via the booking-link follow-up call.
    address: Mapped[str | None] = mapped_column(nullable=True)
    check_in_date: Mapped[str] = mapped_column(nullable=False)
    check_out_date: Mapped[str] = mapped_column(nullable=False)
    price_per_night: Mapped[float] = mapped_column(nullable=False)
    rating: Mapped[float | None] = mapped_column(nullable=True)
    distance_km: Mapped[float | None] = mapped_column(nullable=True)
    # Nullable: only search results carry gps_coordinates (custom lodging never does).
    # Consumed by map/service.py to plot points without geocoding.
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
