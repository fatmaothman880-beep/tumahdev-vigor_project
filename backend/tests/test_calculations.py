from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.models.models import DataQuality
from app.services.calculations import (
    calculate_berth_release,
    calculate_effective_rate,
    calculate_estimated_finish,
    calculate_progress_percentage,
    calculate_remaining_cargo,
)
from app.services.prediction_service import determine_data_quality


def make_reading(
    recorded_at: datetime,
    unloaded_t: str,
    observed_rate_tph: str | None = None,
    buffer_level_t: str | None = "650",
    buffer_capacity_t: str | None = "1000",
):
    return SimpleNamespace(
        recorded_at=recorded_at,
        unloaded_t=Decimal(unloaded_t),
        observed_rate_tph=(
            Decimal(observed_rate_tph)
            if observed_rate_tph is not None
            else None
        ),
        buffer_level_t=(
            Decimal(buffer_level_t)
            if buffer_level_t is not None
            else None
        ),
        buffer_capacity_t=(
            Decimal(buffer_capacity_t)
            if buffer_capacity_t is not None
            else None
        ),
    )


def test_remaining_cargo() -> None:
    result = calculate_remaining_cargo(
        Decimal("12500"),
        Decimal("4950"),
    )

    assert result == Decimal("7550.00")


def test_remaining_cargo_cannot_be_negative() -> None:
    result = calculate_remaining_cargo(
        Decimal("12500"),
        Decimal("13000"),
    )

    assert result == Decimal("0.00")


def test_progress_percentage() -> None:
    result = calculate_progress_percentage(
        Decimal("12500"),
        Decimal("4950"),
    )

    assert result == Decimal("39.60")


def test_progress_is_limited_to_100_percent() -> None:
    result = calculate_progress_percentage(
        Decimal("12500"),
        Decimal("13000"),
    )

    assert result == Decimal("100.00")


def test_invalid_cargo_total_raises_error() -> None:
    with pytest.raises(
        ValueError,
        match="Cargo total must be greater than zero",
    ):
        calculate_remaining_cargo(
            Decimal("0"),
            Decimal("0"),
        )


def test_negative_unloaded_cargo_raises_error() -> None:
    with pytest.raises(
        ValueError,
        match="Unloaded cargo cannot be negative",
    ):
        calculate_progress_percentage(
            Decimal("12500"),
            Decimal("-1"),
        )


def test_effective_rate_from_multiple_readings() -> None:
    start = datetime(2026, 8, 27, 8, 0, tzinfo=timezone.utc)

    readings = [
        make_reading(start, "4000", "450"),
        make_reading(
            start + timedelta(hours=1),
            "4475",
            "475",
        ),
        make_reading(
            start + timedelta(hours=2),
            "4950",
            "475",
        ),
    ]

    result = calculate_effective_rate(readings)

    assert result == Decimal("475.00")


def test_effective_rate_uses_single_observed_rate() -> None:
    recorded_at = datetime(
        2026,
        8,
        27,
        8,
        0,
        tzinfo=timezone.utc,
    )

    readings = [
        make_reading(recorded_at, "4950", "475"),
    ]

    result = calculate_effective_rate(readings)

    assert result == Decimal("475.00")


def test_effective_rate_is_none_without_readings() -> None:
    assert calculate_effective_rate([]) is None


def test_estimated_finish() -> None:
    generated_at = datetime(
        2026,
        8,
        27,
        10,
        0,
        tzinfo=timezone.utc,
    )

    result = calculate_estimated_finish(
        generated_at,
        Decimal("950"),
        Decimal("475"),
    )

    assert result == generated_at + timedelta(hours=2)


def test_finish_is_none_without_valid_rate() -> None:
    generated_at = datetime.now(timezone.utc)

    result = calculate_estimated_finish(
        generated_at,
        Decimal("7550"),
        None,
    )

    assert result is None


def test_berth_release_adds_post_unloading_time() -> None:
    finish = datetime(
        2026,
        8,
        27,
        12,
        0,
        tzinfo=timezone.utc,
    )

    result = calculate_berth_release(finish, 45)

    assert result == finish + timedelta(minutes=45)


def test_data_quality_is_valid() -> None:
    generated_at = datetime(
        2026,
        8,
        27,
        10,
        0,
        tzinfo=timezone.utc,
    )

    readings = [
        make_reading(
            generated_at - timedelta(hours=1),
            "4475",
            "475",
        ),
        make_reading(
            generated_at,
            "4950",
            "475",
        ),
    ]

    result = determine_data_quality(
        readings,
        generated_at,
    )

    assert result == DataQuality.VALID


def test_data_quality_is_stale() -> None:
    generated_at = datetime(
        2026,
        8,
        27,
        10,
        0,
        tzinfo=timezone.utc,
    )

    readings = [
        make_reading(
            generated_at - timedelta(hours=4),
            "4000",
            "450",
        ),
        make_reading(
            generated_at - timedelta(hours=3),
            "4475",
            "475",
        ),
    ]

    result = determine_data_quality(
        readings,
        generated_at,
    )

    assert result == DataQuality.STALE


def test_data_quality_is_insufficient_without_readings() -> None:
    result = determine_data_quality(
        [],
        datetime.now(timezone.utc),
    )

    assert result == DataQuality.INSUFFICIENT


def test_data_quality_is_invalid_when_buffer_exceeds_capacity() -> None:
    generated_at = datetime.now(timezone.utc)

    readings = [
        make_reading(
            generated_at,
            "4950",
            "475",
            buffer_level_t="1100",
            buffer_capacity_t="1000",
        ),
    ]

    result = determine_data_quality(
        readings,
        generated_at,
    )

    assert result == DataQuality.INVALID