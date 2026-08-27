from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.services.reading_validation import (
    validate_operational_reading,
)


def test_valid_operational_reading() -> None:
    current_time = datetime.now(timezone.utc)

    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=current_time,
        unloaded_t=Decimal("4950"),
        observed_rate_tph=Decimal("475"),
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
        previous_recorded_at=current_time - timedelta(hours=1),
        previous_unloaded_t=Decimal("4475"),
    )

    assert result.is_valid is True
    assert result.errors == ()
    assert result.warnings == ()


def test_unloaded_cargo_cannot_exceed_total() -> None:
    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=datetime.now(timezone.utc),
        unloaded_t=Decimal("13000"),
        observed_rate_tph=Decimal("475"),
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.is_valid is False
    assert (
        "Unloaded cargo cannot exceed total vessel cargo."
        in result.errors
    )


def test_cumulative_unloaded_cargo_cannot_decrease() -> None:
    current_time = datetime.now(timezone.utc)

    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=current_time,
        unloaded_t=Decimal("4000"),
        observed_rate_tph=Decimal("475"),
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
        previous_recorded_at=current_time - timedelta(hours=1),
        previous_unloaded_t=Decimal("4475"),
    )

    assert result.is_valid is False
    assert (
        "Cumulative unloaded cargo cannot decrease."
        in result.errors
    )


def test_reading_time_must_increase() -> None:
    current_time = datetime.now(timezone.utc)

    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=current_time - timedelta(hours=2),
        unloaded_t=Decimal("4950"),
        observed_rate_tph=Decimal("475"),
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
        previous_recorded_at=current_time,
        previous_unloaded_t=Decimal("4475"),
    )

    assert result.is_valid is False
    assert (
        "Reading time must be later than the previous reading."
        in result.errors
    )


def test_buffer_cannot_exceed_capacity() -> None:
    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=datetime.now(timezone.utc),
        unloaded_t=Decimal("4950"),
        observed_rate_tph=Decimal("475"),
        buffer_level_t=Decimal("1100"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.is_valid is False
    assert (
        "Buffer level cannot exceed buffer capacity."
        in result.errors
    )


def test_missing_optional_values_create_warnings() -> None:
    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=datetime.now(timezone.utc),
        unloaded_t=Decimal("4950"),
        observed_rate_tph=None,
        buffer_level_t=None,
        buffer_capacity_t=None,
        packaging_rate_tph=None,
    )

    assert result.is_valid is True
    assert len(result.warnings) == 4


def test_zero_rate_with_remaining_cargo_creates_warning() -> None:
    result = validate_operational_reading(
        cargo_total_t=Decimal("12500"),
        recorded_at=datetime.now(timezone.utc),
        unloaded_t=Decimal("4950"),
        observed_rate_tph=Decimal("0"),
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.is_valid is True
    assert (
        "Unloading rate is zero while cargo remains."
        in result.warnings
    )