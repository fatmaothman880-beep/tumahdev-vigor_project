from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.models import (
    DataQuality,
    OperationalReading,
    Prediction,
    VesselVisit,
    VisitStatus,
)
from app.services.calculations import (
    calculate_berth_release,
    calculate_effective_rate,
    calculate_estimated_finish,
    calculate_progress_percentage,
    calculate_remaining_cargo,
)


def determine_data_quality(
    readings: list[OperationalReading],
    generated_at: datetime,
) -> DataQuality:
    """Determine whether operational data is usable for prediction."""

    if not readings:
        return DataQuality.INSUFFICIENT

    latest_reading = max(
        readings,
        key=lambda reading: reading.recorded_at,
    )

    if latest_reading.unloaded_t < 0:
        return DataQuality.INVALID

    if (
        latest_reading.buffer_level_t is not None
        and latest_reading.buffer_capacity_t is not None
        and latest_reading.buffer_level_t
        > latest_reading.buffer_capacity_t
    ):
        return DataQuality.INVALID

    if generated_at - latest_reading.recorded_at > timedelta(hours=2):
        return DataQuality.STALE

    effective_rate = calculate_effective_rate(readings)

    if effective_rate is None:
        return DataQuality.INSUFFICIENT

    return DataQuality.VALID


def generate_prediction(
    db: Session,
    visit_id: UUID,
    generated_at: datetime | None = None,
) -> Prediction:
    """Generate and save a prediction for one vessel visit."""

    generated_at = generated_at or datetime.now(timezone.utc)

    visit = db.scalar(
        select(VesselVisit)
        .options(selectinload(VesselVisit.readings))
        .where(VesselVisit.id == visit_id)
    )

    if visit is None:
        raise ValueError(f"Vessel visit {visit_id} was not found.")

    readings = sorted(
        visit.readings,
        key=lambda reading: reading.recorded_at,
    )

    if readings:
        latest_unloaded_t = readings[-1].unloaded_t
    else:
        latest_unloaded_t = visit.cargo_total_t * 0

    remaining_t = calculate_remaining_cargo(
        visit.cargo_total_t,
        latest_unloaded_t,
    )

    progress_pct = calculate_progress_percentage(
        visit.cargo_total_t,
        latest_unloaded_t,
    )

    effective_rate_tph = calculate_effective_rate(readings)

    estimated_finish = calculate_estimated_finish(
        readings[-1].recorded_at if readings else generated_at,
        remaining_t,
        effective_rate_tph,
    )

    expected_release = calculate_berth_release(
        estimated_finish,
        visit.post_unloading_minutes,
    )

    data_quality = determine_data_quality(
        readings,
        generated_at,
    )

    if data_quality != DataQuality.VALID or (readings and readings[-1].unloading_status.value == "STOPPED"):
        estimated_finish = None
    if visit.status in (VisitStatus.CANCELLED, VisitStatus.DEPARTED, VisitStatus.DELAYED):
        estimated_finish = None
    if visit.status == VisitStatus.COMPLETED:
        estimated_finish = visit.unload_end
    expected_release = calculate_berth_release(estimated_finish, visit.post_unloading_minutes)

    prediction = Prediction(
        visit_id=visit.id,
        generated_at=generated_at,
        remaining_t=remaining_t,
        progress_pct=progress_pct,
        effective_rate_tph=effective_rate_tph,
        estimated_unload_finish=estimated_finish,
        expected_berth_release=expected_release,
        method="ELAPSED_CUMULATIVE",
        data_quality=data_quality,
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return prediction
