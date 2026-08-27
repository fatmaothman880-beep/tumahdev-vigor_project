from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol, Sequence


ZERO = Decimal("0")
HUNDRED = Decimal("100")
TWO_DECIMALS = Decimal("0.01")


class ReadingLike(Protocol):
    recorded_at: datetime
    unloaded_t: Decimal
    observed_rate_tph: Decimal | None


def calculate_remaining_cargo(
    cargo_total_t: Decimal,
    unloaded_t: Decimal,
) -> Decimal:
    """Calculate cargo still remaining on the vessel."""

    if cargo_total_t <= ZERO:
        raise ValueError("Cargo total must be greater than zero.")

    if unloaded_t < ZERO:
        raise ValueError("Unloaded cargo cannot be negative.")

    remaining = cargo_total_t - unloaded_t

    return max(remaining, ZERO).quantize(
        TWO_DECIMALS,
        rounding=ROUND_HALF_UP,
    )


def calculate_progress_percentage(
    cargo_total_t: Decimal,
    unloaded_t: Decimal,
) -> Decimal:
    """Calculate unloading completion percentage between 0 and 100."""

    if cargo_total_t <= ZERO:
        raise ValueError("Cargo total must be greater than zero.")

    if unloaded_t < ZERO:
        raise ValueError("Unloaded cargo cannot be negative.")

    progress = (unloaded_t / cargo_total_t) * HUNDRED
    bounded_progress = min(max(progress, ZERO), HUNDRED)

    return bounded_progress.quantize(
        TWO_DECIMALS,
        rounding=ROUND_HALF_UP,
    )


def calculate_effective_rate(
    readings: Sequence[ReadingLike],
) -> Decimal | None:
    """
    Calculate the effective unloading rate from cumulative readings.

    The calculation uses:
        change in unloaded cargo / elapsed hours

    If only one reading exists, its observed rate is used as a fallback.
    """

    if not readings:
        return None

    ordered_readings = sorted(
        readings,
        key=lambda reading: reading.recorded_at,
    )

    if len(ordered_readings) == 1:
        observed_rate = ordered_readings[0].observed_rate_tph

        if observed_rate is None or observed_rate <= ZERO:
            return None

        return observed_rate.quantize(
            TWO_DECIMALS,
            rounding=ROUND_HALF_UP,
        )

    first_reading = ordered_readings[0]
    latest_reading = ordered_readings[-1]

    elapsed_seconds = Decimal(
        str(
            (
                latest_reading.recorded_at
                - first_reading.recorded_at
            ).total_seconds()
        )
    )

    if elapsed_seconds <= ZERO:
        return None

    unloaded_difference = (
        latest_reading.unloaded_t
        - first_reading.unloaded_t
    )

    if unloaded_difference <= ZERO:
        return None

    elapsed_hours = elapsed_seconds / Decimal("3600")
    effective_rate = unloaded_difference / elapsed_hours

    return effective_rate.quantize(
        TWO_DECIMALS,
        rounding=ROUND_HALF_UP,
    )


def calculate_estimated_finish(
    generated_at: datetime,
    remaining_t: Decimal,
    effective_rate_tph: Decimal | None,
) -> datetime | None:
    """Estimate when unloading will finish."""

    if remaining_t < ZERO:
        raise ValueError("Remaining cargo cannot be negative.")

    if remaining_t == ZERO:
        return generated_at

    if effective_rate_tph is None or effective_rate_tph <= ZERO:
        return None

    remaining_hours = remaining_t / effective_rate_tph

    return generated_at + timedelta(
        seconds=float(remaining_hours * Decimal("3600"))
    )


def calculate_berth_release(
    estimated_finish: datetime | None,
    post_unloading_minutes: int,
) -> datetime | None:
    """Calculate berth release time after unloading is completed."""

    if post_unloading_minutes < 0:
        raise ValueError(
            "Post-unloading minutes cannot be negative."
        )

    if estimated_finish is None:
        return None

    return estimated_finish + timedelta(
        minutes=post_unloading_minutes
    )