from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class FrontendOperationalState(Base):
    """Durable state for the full-cycle operations UI.

    Core port-call records remain normalized in their existing tables. This
    document stores the wider planning modules (fuel, treasury, tracking and
    manufacturer queue) without losing fields owned by the frontend domain.
    """

    __tablename__ = "frontend_operational_state"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
