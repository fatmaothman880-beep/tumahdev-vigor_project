"""Site master data and an operator-recorded checklist, separate from approvals."""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class SiteConfiguration(Base):
    __tablename__ = "site_configuration"
    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    berth_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("berths.id", ondelete="RESTRICT"))
    berth_label: Mapped[str] = mapped_column(String(150))


class SiteVessel(Base):
    __tablename__ = "site_vessels"
    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    site_key: Mapped[str] = mapped_column(ForeignKey("site_configuration.key", ondelete="RESTRICT"))
    vessel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vessels.id", ondelete="RESTRICT"), unique=True)
    reported_cargo_t: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    temporary_label: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (CheckConstraint("reported_cargo_t IS NULL OR reported_cargo_t > 0", name="ck_site_vessel_reported_cargo"),)


class OperationalTask(Base):
    __tablename__ = "operational_tasks"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vessel_visits.id", ondelete="RESTRICT"), index=True)
    template_key: Mapped[str | None] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(50))
    owner_name: Mapped[str | None] = mapped_column(String(150))
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(30), default="NOT_STARTED")
    blocks_departure: Mapped[bool] = mapped_column(Boolean, default=False)
    reason: Mapped[str] = mapped_column(Text, default="")
    evidence_reference: Mapped[str] = mapped_column(String(500), default="")
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __mapper_args__ = {"version_id_col": version}
    __table_args__ = (
        UniqueConstraint("visit_id", "template_key", name="uq_visit_task_template"),
        CheckConstraint("status IN ('NOT_STARTED','IN_PROGRESS','BLOCKED','COMPLETED','NOT_APPLICABLE')", name="ck_operational_task_status"),
        CheckConstraint("(status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)", name="ck_operational_task_completed"),
    )


class TaskHistory(Base):
    __tablename__ = "task_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("operational_tasks.id", ondelete="RESTRICT"), index=True)
    performed_by: Mapped[str] = mapped_column(String(150))
    task_version: Mapped[int] = mapped_column(Integer)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    old_value: Mapped[dict | None] = mapped_column(JSONB)
    new_value: Mapped[dict] = mapped_column(JSONB)
    __table_args__ = (UniqueConstraint("task_id", "task_version", name="uq_task_history_version"),)
