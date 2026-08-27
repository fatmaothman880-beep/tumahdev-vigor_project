from decimal import Decimal

from app.services.buffer_monitoring import evaluate_buffer_risk


def test_balanced_buffer_operation() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=Decimal("650"),
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("475"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.risk_level == "LOW"
    assert result.risk_type == "BALANCED"
    assert result.buffer_percentage == Decimal("65.00")
    assert result.net_flow_tph == Decimal("75.00")


def test_high_overflow_risk() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=Decimal("950"),
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("500"),
        packaging_rate_tph=Decimal("300"),
    )

    assert result.risk_level == "HIGH"
    assert result.risk_type == "OVERFLOW"
    assert result.recommended_action == "REDUCE_OR_PAUSE_UNLOADING"


def test_medium_high_buffer_warning() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=Decimal("820"),
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("450"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.risk_level == "MEDIUM"
    assert result.risk_type == "HIGH_BUFFER"


def test_high_empty_buffer_risk() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=Decimal("80"),
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("300"),
        packaging_rate_tph=Decimal("450"),
    )

    assert result.risk_level == "HIGH"
    assert result.risk_type == "EMPTY_BUFFER"


def test_missing_data_returns_unknown() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=None,
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("475"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.risk_level == "UNKNOWN"
    assert result.risk_type == "INSUFFICIENT_DATA"


def test_invalid_buffer_value() -> None:
    result = evaluate_buffer_risk(
        buffer_level_t=Decimal("1100"),
        buffer_capacity_t=Decimal("1000"),
        unloading_rate_tph=Decimal("475"),
        packaging_rate_tph=Decimal("400"),
    )

    assert result.risk_level == "INVALID"
    assert result.risk_type == "INVALID_DATA"