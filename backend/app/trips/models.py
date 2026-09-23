from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, now_iso


class Trip(Base):
    __tablename__: str = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    destinations: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    start_date: Mapped[str | None] = mapped_column(nullable=True)
    end_date: Mapped[str | None] = mapped_column(nullable=True)
    travelers: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[str] = mapped_column(nullable=False, default=now_iso)
    updated_at: Mapped[str] = mapped_column(nullable=False, default=now_iso, onupdate=now_iso)
