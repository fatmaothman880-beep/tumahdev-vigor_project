from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.models import (
    OperationalReading,
    Prediction,
    VesselVisit,
    VisitStatus,
)
from app.services.berth_conflict_service import (
    evaluate_next_berth_call,
)
from app.services.buffer_monitoring import evaluate_buffer_risk


TWO_DECIMALS = Decimal("0.01")


@dataclass(frozen=True)
class DashboardSnapshot:
    visit_id: UUID
    vessel_name: str
    berth_name: str
    cargo_type: str
    cargo_total_t: Decimal
    visit_status: str

    recorded_at: datetime | None
    unloaded_t: Decimal
    remaining_t: Decimal
    progress_pct: Decimal
    unloading_rate_tph: Decimal | None
    unloading_status: str | None

    buffer_level_t: Decimal | None
    buffer_capacity_t: Decimal | None
    buffer_percentage: Decimal | None
    buffer_risk_level: str
    buffer_risk_type: str
    buffer_net_flow_tph: Decimal | None
    buffer_hours_to_full: Decimal | None
    buffer_hours_to_empty: Decimal | None
    buffer_recommended_action: str
    buffer_message: str

    packaging_rate_tph: Decimal | None
    packaging_status: str | None

    estimated_unload_finish: datetime | None
    expected_berth_release: datetime | None
    data_quality: str

    next_vessel_arrival: datetime | None
    berth_conflict: bool | None
    berth_risk_level: str
    berth_gap_minutes: int | None
    berth_message: str


def calculate_buffer_percentage(
    buffer_level_t: Decimal | None,
    buffer_capacity_t: Decimal | None,
) -> Decimal | None:
    """Calculate buffer utilization between 0 and 100 percent."""

    if buffer_level_t is None or buffer_capacity_t is None:
        return None

    if buffer_capacity_t <= 0:
        return None

    percentage = (
        buffer_level_t / buffer_capacity_t
    ) * Decimal("100")

    return percentage.quantize(
        TWO_DECIMALS,
        rounding=ROUND_HALF_UP,
    )


def get_active_dashboard(
    db: Session,
) -> DashboardSnapshot | None:
    """Return the latest dashboard snapshot for the active vessel."""

    visit = db.scalar(
        select(VesselVisit)
        .options(
            selectinload(VesselVisit.vessel),
            selectinload(VesselVisit.berth),
        )
        .where(
            VesselVisit.status.in_(
                [
                    VisitStatus.ARRIVED,
                    VisitStatus.BERTHED,
                    VisitStatus.DELAYED,
                    VisitStatus.UNLOADING,
                ]
            )
        )
        .order_by(VesselVisit.created_at.desc())
        .limit(1)
    )

    if visit is None:
        return None

    latest_reading = db.scalar(
        select(OperationalReading)
        .where(OperationalReading.visit_id == visit.id)
        .order_by(OperationalReading.recorded_at.desc())
        .limit(1)
    )

    latest_prediction = db.scalar(
        select(Prediction)
        .where(Prediction.visit_id == visit.id)
        .order_by(Prediction.generated_at.desc())
        .limit(1)
    )

    unloaded_t = (
        latest_reading.unloaded_t
        if latest_reading is not None
        else Decimal("0.00")
    )

    remaining_t = (
        latest_prediction.remaining_t
        if latest_prediction is not None
        else max(
            visit.cargo_total_t - unloaded_t,
            Decimal("0.00"),
        )
    )

    progress_pct = (
        latest_prediction.progress_pct
        if latest_prediction is not None
        else (
            unloaded_t
            / visit.cargo_total_t
            * Decimal("100")
        ).quantize(
            TWO_DECIMALS,
            rounding=ROUND_HALF_UP,
        )
    )

    effective_unloading_rate = (
        latest_prediction.effective_rate_tph
        if latest_prediction is not None
        else (
            latest_reading.observed_rate_tph
            if latest_reading is not None
            else None
        )
    )

    buffer_percentage = calculate_buffer_percentage(
        (
            latest_reading.buffer_level_t
            if latest_reading is not None
            else None
        ),
        (
            latest_reading.buffer_capacity_t
            if latest_reading is not None
            else None
        ),
    )

    buffer_risk = evaluate_buffer_risk(
        buffer_level_t=(
            latest_reading.buffer_level_t
            if latest_reading is not None
            else None
        ),
        buffer_capacity_t=(
            latest_reading.buffer_capacity_t
            if latest_reading is not None
            else None
        ),
        unloading_rate_tph=effective_unloading_rate,
        packaging_rate_tph=(
            latest_reading.packaging_rate_tph
            if latest_reading is not None
            else None
        ),
    )

    conflict_evaluation = evaluate_next_berth_call(
        db,
        visit.berth_id,
    )

    if conflict_evaluation is None:
        next_vessel_arrival = None
        berth_conflict = None
        berth_risk_level = "NONE"
        berth_gap_minutes = None
        berth_message = "No upcoming vessel call found."
    else:
        conflict = conflict_evaluation.conflict
        next_vessel_arrival = (
            conflict_evaluation.expected_arrival
        )
        berth_conflict = conflict.has_conflict
        berth_risk_level = conflict.risk_level
        berth_gap_minutes = conflict.gap_minutes
        berth_message = conflict.message

    return DashboardSnapshot(
        visit_id=visit.id,
        vessel_name=visit.vessel.name,
        berth_name=visit.berth.name,
        cargo_type=visit.cargo_type,
        cargo_total_t=visit.cargo_total_t,
        visit_status=visit.status.value,

        recorded_at=(
            latest_reading.recorded_at
            if latest_reading is not None
            else None
        ),
        unloaded_t=unloaded_t,
        remaining_t=remaining_t,
        progress_pct=progress_pct,
        unloading_rate_tph=effective_unloading_rate,
        unloading_status=(
            latest_reading.unloading_status.value
            if latest_reading is not None
            else None
        ),

        buffer_level_t=(
            latest_reading.buffer_level_t
            if latest_reading is not None
            else None
        ),
        buffer_capacity_t=(
            latest_reading.buffer_capacity_t
            if latest_reading is not None
            else None
        ),
        buffer_percentage=buffer_percentage,
        buffer_risk_level=buffer_risk.risk_level,
        buffer_risk_type=buffer_risk.risk_type,
        buffer_net_flow_tph=buffer_risk.net_flow_tph,
        buffer_hours_to_full=buffer_risk.hours_to_full,
        buffer_hours_to_empty=buffer_risk.hours_to_empty,
        buffer_recommended_action=(
            buffer_risk.recommended_action
        ),
        buffer_message=buffer_risk.message,

        packaging_rate_tph=(
            latest_reading.packaging_rate_tph
            if latest_reading is not None
            else None
        ),
        packaging_status=(
            latest_reading.packaging_status.value
            if latest_reading is not None
            and latest_reading.packaging_status is not None
            else None
        ),

        estimated_unload_finish=(
            latest_prediction.estimated_unload_finish
            if latest_prediction is not None
            else None
        ),
        expected_berth_release=(
            latest_prediction.expected_berth_release
            if latest_prediction is not None
            else None
        ),
        data_quality=(
            latest_prediction.data_quality.value
            if latest_prediction is not None
            else "INSUFFICIENT"
        ),

        next_vessel_arrival=next_vessel_arrival,
        berth_conflict=berth_conflict,
        berth_risk_level=berth_risk_level,
        berth_gap_minutes=berth_gap_minutes,
        berth_message=berth_message,
    )
