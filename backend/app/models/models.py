import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.workflow import SiteConfiguration, SiteVessel, OperationalTask, TaskHistory  # noqa: F401


class BerthStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"


class VisitStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ARRIVED = "ARRIVED"
    BERTHED = "BERTHED"
    DELAYED = "DELAYED"
    UNLOADING = "UNLOADING"
    COMPLETED = "COMPLETED"
    DEPARTED = "DEPARTED"
    CANCELLED = "CANCELLED"


class ReadingSource(str, enum.Enum):
    MANUAL = "MANUAL"
    CSV = "CSV"
    DEMO = "DEMO"


class UnloadingStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    STOPPED = "STOPPED"
    COMPLETED = "COMPLETED"


class PackagingStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    STOPPED = "STOPPED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class DataQuality(str, enum.Enum):
    VALID = "VALID"
    STALE = "STALE"
    INSUFFICIENT = "INSUFFICIENT"
    INVALID = "INVALID"


class UpcomingCallStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    CONFIRMED = "CONFIRMED"
    ARRIVED = "ARRIVED"
    CANCELLED = "CANCELLED"


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
class Vessel(Base):
    __tablename__ = "vessels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    imo_reference: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
    )
    capacity_t: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    agent_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    agent_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    visits: Mapped[list["VesselVisit"]] = relationship(
        back_populates="vessel",
    )
    upcoming_calls: Mapped[list["UpcomingVesselCall"]] = relationship(
        back_populates="vessel",
    )

    __table_args__ = (
        CheckConstraint(
            "capacity_t IS NULL OR capacity_t > 0",
            name="ck_vessels_capacity_positive",
        ),
    )


class Berth(Base):
    __tablename__ = "berths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    status: Mapped[BerthStatus] = mapped_column(
        Enum(BerthStatus, name="berth_status"),
        default=BerthStatus.AVAILABLE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    visits: Mapped[list["VesselVisit"]] = relationship(
        back_populates="berth",
    )
    upcoming_calls: Mapped[list["UpcomingVesselCall"]] = relationship(
        back_populates="berth",
    )


class VesselVisit(Base):
    __tablename__ = "vessel_visits"

    planned_unload_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_completion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_rate_tph: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    vessel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vessels.id", ondelete="RESTRICT"),
        nullable=False,
    )
    berth_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("berths.id", ondelete="RESTRICT"),
        nullable=False,
    )
    cargo_type: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo_total_t: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    planned_arrival: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    actual_arrival: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    unload_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    unload_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    planned_departure: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    actual_departure: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    post_unloading_minutes: Mapped[int] = mapped_column(
        Integer,
        default=45,
        nullable=False,
    )
    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus, name="visit_status"),
        default=VisitStatus.PLANNED,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    vessel: Mapped["Vessel"] = relationship(back_populates="visits")
    berth: Mapped["Berth"] = relationship(back_populates="visits")

    readings: Mapped[list["OperationalReading"]] = relationship(
        back_populates="visit",
        cascade="all, delete-orphan",
    )
    delay_events: Mapped[list["DelayEvent"]] = relationship(
        back_populates="visit",
        cascade="all, delete-orphan",
    )
    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="visit",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "cargo_total_t > 0",
            name="ck_vessel_visits_cargo_positive",
        ),
        CheckConstraint(
            "post_unloading_minutes >= 0",
            name="ck_vessel_visits_post_unloading_nonnegative",
        ),
        CheckConstraint(
            "unload_end IS NULL OR unload_start IS NULL "
            "OR unload_end >= unload_start",
            name="ck_vessel_visits_unload_times",
        ),
        CheckConstraint(
            "actual_departure IS NULL OR actual_arrival IS NULL "
            "OR actual_departure >= actual_arrival",
            name="ck_vessel_visits_departure_times",
        ),
        Index("ix_vessel_visits_vessel_id", "vessel_id"),
        Index("ix_vessel_visits_berth_id", "berth_id"),
        Index("ix_vessel_visits_status", "status"),
        Index("ix_vessel_visits_planned_arrival", "planned_arrival"),
    )
class OperationalReading(Base):
    __tablename__ = "operational_readings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vessel_visits.id", ondelete="CASCADE"),
        nullable=False,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    source: Mapped[ReadingSource] = mapped_column(
        Enum(ReadingSource, name="reading_source"),
        nullable=False,
    )
    unloaded_t: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    observed_rate_tph: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    buffer_level_t: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    buffer_capacity_t: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    packaging_rate_tph: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    unloading_status: Mapped[UnloadingStatus] = mapped_column(
        Enum(UnloadingStatus, name="unloading_status"),
        nullable=False,
    )
    packaging_status: Mapped[PackagingStatus | None] = mapped_column(
        Enum(PackagingStatus, name="packaging_status"),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    visit: Mapped["VesselVisit"] = relationship(back_populates="readings")

    __table_args__ = (
        CheckConstraint(
            "unloaded_t >= 0",
            name="ck_operational_readings_unloaded_nonnegative",
        ),
        CheckConstraint(
            "observed_rate_tph IS NULL OR observed_rate_tph >= 0",
            name="ck_operational_readings_rate_nonnegative",
        ),
        CheckConstraint(
            "buffer_level_t IS NULL OR buffer_level_t >= 0",
            name="ck_operational_readings_buffer_nonnegative",
        ),
        CheckConstraint(
            "buffer_capacity_t IS NULL OR buffer_capacity_t > 0",
            name="ck_operational_readings_capacity_positive",
        ),
        CheckConstraint(
            "packaging_rate_tph IS NULL OR packaging_rate_tph >= 0",
            name="ck_operational_readings_packaging_rate_nonnegative",
        ),
        CheckConstraint(
            "buffer_level_t IS NULL OR buffer_capacity_t IS NULL "
            "OR buffer_level_t <= buffer_capacity_t",
            name="ck_operational_readings_buffer_within_capacity",
        ),
        UniqueConstraint(
            "visit_id",
            "recorded_at",
            name="uq_operational_readings_visit_recorded_at",
        ),
        Index(
            "ix_operational_readings_visit_recorded_at",
            "visit_id",
            "recorded_at",
        ),
    )


class DelayEvent(Base):
    __tablename__ = "delay_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vessel_visits.id", ondelete="CASCADE"),
        nullable=False,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    cause: Mapped[str] = mapped_column(String(150), nullable=False)
    responsible_area: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    equipment: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    visit: Mapped["VesselVisit"] = relationship(
        back_populates="delay_events",
    )

    __table_args__ = (
        CheckConstraint(
            "end_time IS NULL OR end_time >= start_time",
            name="ck_delay_events_valid_times",
        ),
        Index("ix_delay_events_visit_id", "visit_id"),
        Index("ix_delay_events_category", "category"),
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vessel_visits.id", ondelete="CASCADE"),
        nullable=False,
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    remaining_t: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    progress_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    effective_rate_tph: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    estimated_unload_finish: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    expected_berth_release: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    data_quality: Mapped[DataQuality] = mapped_column(
        Enum(DataQuality, name="data_quality"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    visit: Mapped["VesselVisit"] = relationship(
        back_populates="predictions",
    )

    __table_args__ = (
        CheckConstraint(
            "remaining_t >= 0",
            name="ck_predictions_remaining_nonnegative",
        ),
        CheckConstraint(
            "progress_pct >= 0 AND progress_pct <= 100",
            name="ck_predictions_progress_range",
        ),
        CheckConstraint(
            "effective_rate_tph IS NULL OR effective_rate_tph > 0",
            name="ck_predictions_rate_positive",
        ),
        CheckConstraint(
            "expected_berth_release IS NULL "
            "OR estimated_unload_finish IS NULL "
            "OR expected_berth_release >= estimated_unload_finish",
            name="ck_predictions_release_after_finish",
        ),
        Index(
            "ix_predictions_visit_generated_at",
            "visit_id",
            "generated_at",
        ),
    )
class UpcomingVesselCall(Base):
    __tablename__ = "upcoming_vessel_calls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    vessel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vessels.id", ondelete="RESTRICT"),
        nullable=False,
    )
    berth_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("berths.id", ondelete="RESTRICT"),
        nullable=False,
    )
    expected_arrival: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    cargo_type: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo_quantity_t: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    expected_rate_tph: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    call_alert_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    confirmation_due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    berth_preparation_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    status: Mapped[UpcomingCallStatus] = mapped_column(
        Enum(UpcomingCallStatus, name="upcoming_call_status"),
        default=UpcomingCallStatus.PLANNED,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    vessel: Mapped["Vessel"] = relationship(
        back_populates="upcoming_calls",
    )
    berth: Mapped["Berth"] = relationship(
        back_populates="upcoming_calls",
    )

    __table_args__ = (
        CheckConstraint(
            "cargo_quantity_t > 0",
            name="ck_upcoming_calls_cargo_positive",
        ),
        CheckConstraint(
            "expected_rate_tph IS NULL OR expected_rate_tph > 0",
            name="ck_upcoming_calls_rate_positive",
        ),
        CheckConstraint(
            "berth_preparation_minutes >= 0",
            name="ck_upcoming_calls_preparation_nonnegative",
        ),
        CheckConstraint(
            "call_alert_at IS NULL OR call_alert_at <= expected_arrival",
            name="ck_upcoming_calls_alert_before_arrival",
        ),
        CheckConstraint(
            "confirmation_due_at IS NULL "
            "OR confirmation_due_at <= expected_arrival",
            name="ck_upcoming_calls_confirmation_before_arrival",
        ),
        Index(
            "ix_upcoming_calls_expected_arrival",
            "expected_arrival",
        ),
        Index("ix_upcoming_calls_status", "status"),
    )


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action"),
        nullable=False,
    )
    entity_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    old_value: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    new_value: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_audit_records_entity", "entity_name", "entity_id"),
        Index("ix_audit_records_created_at", "created_at"),
    )
