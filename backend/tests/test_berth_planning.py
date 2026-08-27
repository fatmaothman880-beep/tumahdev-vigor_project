from datetime import datetime, timedelta, timezone

import pytest

from app.services.berth_planning import evaluate_berth_conflict


def test_no_conflict_with_safe_margin() -> None:
    arrival = datetime(
        2026,
        8,
        28,
        18,
        0,
        tzinfo=timezone.utc,
    )

    release = arrival - timedelta(hours=4)

    result = evaluate_berth_conflict(
        expected_berth_release=release,
        next_vessel_arrival=arrival,
        berth_preparation_minutes=60,
    )

    assert result.has_conflict is False
    assert result.risk_level == "NONE"
    assert result.gap_minutes == 180


def test_low_risk_when_margin_is_small() -> None:
    arrival = datetime(
        2026,
        8,
        28,
        18,
        0,
        tzinfo=timezone.utc,
    )

    release = arrival - timedelta(minutes=90)

    result = evaluate_berth_conflict(
        expected_berth_release=release,
        next_vessel_arrival=arrival,
        berth_preparation_minutes=60,
    )

    assert result.has_conflict is False
    assert result.risk_level == "LOW"
    assert result.gap_minutes == 30


def test_medium_conflict() -> None:
    arrival = datetime(
        2026,
        8,
        28,
        18,
        0,
        tzinfo=timezone.utc,
    )

    release = arrival + timedelta(minutes=30)

    result = evaluate_berth_conflict(
        expected_berth_release=release,
        next_vessel_arrival=arrival,
        berth_preparation_minutes=60,
    )

    assert result.has_conflict is True
    assert result.risk_level == "MEDIUM"
    assert result.gap_minutes == -90


def test_high_conflict() -> None:
    arrival = datetime(
        2026,
        8,
        28,
        18,
        0,
        tzinfo=timezone.utc,
    )

    release = arrival + timedelta(hours=2)

    result = evaluate_berth_conflict(
        expected_berth_release=release,
        next_vessel_arrival=arrival,
        berth_preparation_minutes=60,
    )

    assert result.has_conflict is True
    assert result.risk_level == "HIGH"
    assert result.gap_minutes == -180


def test_unknown_risk_without_release_prediction() -> None:
    arrival = datetime.now(timezone.utc)

    result = evaluate_berth_conflict(
        expected_berth_release=None,
        next_vessel_arrival=arrival,
        berth_preparation_minutes=60,
    )

    assert result.has_conflict is True
    assert result.risk_level == "UNKNOWN"
    assert result.gap_minutes is None


def test_negative_preparation_time_is_rejected() -> None:
    with pytest.raises(
        ValueError,
        match="Berth preparation minutes cannot be negative",
    ):
        evaluate_berth_conflict(
            expected_berth_release=datetime.now(timezone.utc),
            next_vessel_arrival=datetime.now(timezone.utc),
            berth_preparation_minutes=-1,
        )