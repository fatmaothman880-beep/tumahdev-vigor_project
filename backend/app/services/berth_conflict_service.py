from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    Prediction,
    UpcomingCallStatus,
    UpcomingVesselCall,
    VesselVisit,
)
from app.services.berth_planning import (
    BerthConflictResult,
    evaluate_berth_conflict,
)


@dataclass(frozen=True)
class NextCallEvaluation:
    upcoming_call_id: UUID
    vessel_id: UUID
    expected_arrival: datetime
    conflict: BerthConflictResult


def evaluate_next_berth_call(
    db: Session,
    berth_id: UUID,
    current_time: datetime | None = None,
) -> NextCallEvaluation | None:
    """Evaluate the next planned vessel against the latest prediction."""

    current_time = current_time or datetime.now(timezone.utc)

    upcoming_call = db.scalar(
        select(UpcomingVesselCall)
        .where(
            UpcomingVesselCall.berth_id == berth_id,
            UpcomingVesselCall.expected_arrival >= current_time,
            UpcomingVesselCall.status.in_(
                [
                    UpcomingCallStatus.PLANNED,
                    UpcomingCallStatus.CONFIRMED,
                ]
            ),
        )
        .order_by(UpcomingVesselCall.expected_arrival.asc())
        .limit(1)
    )

    if upcoming_call is None:
        return None

    latest_prediction = db.scalar(
        select(Prediction)
        .join(
            VesselVisit,
            Prediction.visit_id == VesselVisit.id,
        )
        .where(VesselVisit.berth_id == berth_id)
        .order_by(Prediction.generated_at.desc())
        .limit(1)
    )

    expected_release = (
        latest_prediction.expected_berth_release
        if latest_prediction is not None
        else None
    )

    conflict = evaluate_berth_conflict(
        expected_berth_release=expected_release,
        next_vessel_arrival=upcoming_call.expected_arrival,
        berth_preparation_minutes=(
            upcoming_call.berth_preparation_minutes
        ),
    )

    return NextCallEvaluation(
        upcoming_call_id=upcoming_call.id,
        vessel_id=upcoming_call.vessel_id,
        expected_arrival=upcoming_call.expected_arrival,
        conflict=conflict,
    )