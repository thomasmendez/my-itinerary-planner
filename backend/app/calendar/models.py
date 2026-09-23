from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, now_iso


class CalendarEntry(Base):
    __tablename__: str = "calendar_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(nullable=False)
    label: Mapped[str] = mapped_column(nullable=False)
    starts_at: Mapped[str] = mapped_column(nullable=False)
    ends_at: Mapped[str] = mapped_column(nullable=False)
    source_type: Mapped[str] = mapped_column(nullable=False)
    source_id: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=False, default=now_iso)
    updated_at: Mapped[str] = mapped_column(nullable=False, default=now_iso, onupdate=now_iso)
