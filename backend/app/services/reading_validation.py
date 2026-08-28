from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


ZERO = Decimal("0")


@dataclass(frozen=True)
class ReadingValidationResult:
    is_valid: bool
    errors: tuple[str, ...]
    warnings: tuple[str, ...]


def validate_operational_reading(
    *,
    cargo_total_t: Decimal,
    recorded_at: datetime,
    unloaded_t: Decimal,
    observed_rate_tph: Decimal | None,
    buffer_level_t: Decimal | None,
    buffer_capacity_t: Decimal | None,
    packaging_rate_tph: Decimal | None,
    previous_recorded_at: datetime | None = None,
    previous_unloaded_t: Decimal | None = None,
) -> ReadingValidationResult:
    """Validate an operational reading before database insertion."""

    errors: list[str] = []
    warnings: list[str] = []

    if cargo_total_t <= ZERO:
        errors.append("Cargo total must be greater than zero.")

    if unloaded_t < ZERO:
        errors.append("Unloaded cargo cannot be negative.")

    if unloaded_t > cargo_total_t:
        errors.append(
            "Unloaded cargo cannot exceed total vessel cargo."
        )

    if observed_rate_tph is not None and observed_rate_tph < ZERO:
        errors.append("Observed unloading rate cannot be negative.")

    if packaging_rate_tph is not None and packaging_rate_tph < ZERO:
        errors.append("Packaging rate cannot be negative.")

    if buffer_level_t is not None and buffer_level_t < ZERO:
        errors.append("Buffer level cannot be negative.")

    if (
        buffer_capacity_t is not None
        and buffer_capacity_t <= ZERO
    ):
        errors.append("Buffer capacity must be greater than zero.")

    if (
        buffer_level_t is not None
        and buffer_capacity_t is not None
        and buffer_level_t > buffer_capacity_t
    ):
        errors.append("Buffer level cannot exceed buffer capacity.")

    if (
        previous_recorded_at is not None
        and recorded_at <= previous_recorded_at
    ):
        errors.append(
            "Reading time must be later than the previous reading."
        )

    if (
        previous_unloaded_t is not None
        and unloaded_t < previous_unloaded_t
    ):
        errors.append(
            "Cumulative unloaded cargo cannot decrease."
        )

    if observed_rate_tph is None:
        warnings.append("Observed unloading rate is missing.")

    if buffer_level_t is None:
        warnings.append("Buffer level is missing.")

    if buffer_capacity_t is None:
        warnings.append("Buffer capacity is missing.")

    if packaging_rate_tph is None:
        warnings.append("Packaging rate is missing.")

    if (
        observed_rate_tph is not None
        and observed_rate_tph == ZERO
        and unloaded_t < cargo_total_t
    ):
        warnings.append(
            "Unloading rate is zero while cargo remains."
        )

    return ReadingValidationResult(
        is_valid=not errors,
        errors=tuple(errors),
        warnings=tuple(warnings),
    )