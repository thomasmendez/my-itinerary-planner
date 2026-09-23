from sqlalchemy.orm import Mapped, mapped_column

from app.common.models import SavedItemMixin
from app.database import Base


class SavedRental(SavedItemMixin, Base):
    __tablename__: str = "saved_rentals"

    description: Mapped[str] = mapped_column(nullable=False)
    pickup_location: Mapped[str] = mapped_column(nullable=False)
    pickup_at: Mapped[str] = mapped_column(nullable=False)
    dropoff_at: Mapped[str] = mapped_column(nullable=False)
    # Nullable: custom rentals allow no price entirely, unlike hotels'
    # price_per_night, which is always required.
    price: Mapped[float | None] = mapped_column(nullable=True)
