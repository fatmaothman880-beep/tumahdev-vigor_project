from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class BerthConflictResult:
    has_conflict: bool
    risk_level: str
    available_at: datetime | None
    required_at: datetime
    gap_minutes: int | None
    message: str


def evaluate_berth_conflict(
    expected_berth_release: datetime | None,
    next_vessel_arrival: datetime,
    berth_preparation_minutes: int = 0,
) -> BerthConflictResult:
    """
    Check whether the berth will be ready for the next vessel.

    Positive gap:
        Berth becomes available before it is required.

    Negative gap:
        Current operation overlaps with the next vessel.
    """

    if berth_preparation_minutes < 0:
        raise ValueError(
            "Berth preparation minutes cannot be negative."
        )

    required_at = next_vessel_arrival - timedelta(
        minutes=berth_preparation_minutes
    )

    if expected_berth_release is None:
        return BerthConflictResult(
            has_conflict=True,
            risk_level="UNKNOWN",
            available_at=None,
            required_at=required_at,
            gap_minutes=None,
            message=(
                "Berth availability cannot be confirmed because "
                "the current vessel has no release prediction."
            ),
        )

    gap_seconds = (
        required_at - expected_berth_release
    ).total_seconds()

    gap_minutes = int(gap_seconds // 60)

    if gap_minutes < 0:
        overlap_minutes = abs(gap_minutes)

        risk_level = (
            "HIGH"
            if overlap_minutes >= 120
            else "MEDIUM"
        )

        return BerthConflictResult(
            has_conflict=True,
            risk_level=risk_level,
            available_at=expected_berth_release,
            required_at=required_at,
            gap_minutes=gap_minutes,
            message=(
                f"Berth conflict detected: expected overlap "
                f"is {overlap_minutes} minutes."
            ),
        )

    risk_level = "LOW" if gap_minutes < 120 else "NONE"

    return BerthConflictResult(
        has_conflict=False,
        risk_level=risk_level,
        available_at=expected_berth_release,
        required_at=required_at,
        gap_minutes=gap_minutes,
        message=(
            f"No berth conflict: available preparation margin "
            f"is {gap_minutes} minutes."
        ),
    )