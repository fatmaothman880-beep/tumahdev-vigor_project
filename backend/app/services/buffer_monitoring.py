from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


ZERO = Decimal("0")
ONE_HUNDRED = Decimal("100")
TWO_DECIMALS = Decimal("0.01")


@dataclass(frozen=True)
class BufferRiskResult:
    risk_level: str
    risk_type: str
    buffer_percentage: Decimal | None
    net_flow_tph: Decimal | None
    hours_to_full: Decimal | None
    hours_to_empty: Decimal | None
    recommended_action: str
    message: str


def _round(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None

    return value.quantize(
        TWO_DECIMALS,
        rounding=ROUND_HALF_UP,
    )


def evaluate_buffer_risk(
    buffer_level_t: Decimal | None,
    buffer_capacity_t: Decimal | None,
    unloading_rate_tph: Decimal | None,
    packaging_rate_tph: Decimal | None,
) -> BufferRiskResult:
    """Evaluate buffer level and incoming/outgoing cargo flow."""

    if (
        buffer_level_t is None
        or buffer_capacity_t is None
        or unloading_rate_tph is None
        or packaging_rate_tph is None
    ):
        return BufferRiskResult(
            risk_level="UNKNOWN",
            risk_type="INSUFFICIENT_DATA",
            buffer_percentage=None,
            net_flow_tph=None,
            hours_to_full=None,
            hours_to_empty=None,
            recommended_action="ENTER_MISSING_DATA",
            message="Buffer risk cannot be calculated because data is missing.",
        )

    if (
        buffer_capacity_t <= ZERO
        or buffer_level_t < ZERO
        or buffer_level_t > buffer_capacity_t
        or unloading_rate_tph < ZERO
        or packaging_rate_tph < ZERO
    ):
        return BufferRiskResult(
            risk_level="INVALID",
            risk_type="INVALID_DATA",
            buffer_percentage=None,
            net_flow_tph=None,
            hours_to_full=None,
            hours_to_empty=None,
            recommended_action="CORRECT_INPUT_DATA",
            message="Buffer or rate values are invalid.",
        )

    buffer_percentage = (
        buffer_level_t / buffer_capacity_t
    ) * ONE_HUNDRED

    net_flow_tph = unloading_rate_tph - packaging_rate_tph

    hours_to_full: Decimal | None = None
    hours_to_empty: Decimal | None = None

    if net_flow_tph > ZERO:
        available_space = buffer_capacity_t - buffer_level_t
        hours_to_full = available_space / net_flow_tph

    elif net_flow_tph < ZERO:
        hours_to_empty = buffer_level_t / abs(net_flow_tph)

    # Immediate or near-immediate overflow risk
    if (
        buffer_percentage >= Decimal("90")
        or (
            hours_to_full is not None
            and hours_to_full <= Decimal("1")
        )
    ):
        return BufferRiskResult(
            risk_level="HIGH",
            risk_type="OVERFLOW",
            buffer_percentage=_round(buffer_percentage),
            net_flow_tph=_round(net_flow_tph),
            hours_to_full=_round(hours_to_full),
            hours_to_empty=None,
            recommended_action="REDUCE_OR_PAUSE_UNLOADING",
            message=(
                "Buffer may overflow. Reduce or temporarily pause unloading."
            ),
        )

    # Immediate or near-immediate empty-buffer risk
    if (
        buffer_percentage <= Decimal("10")
        or (
            hours_to_empty is not None
            and hours_to_empty <= Decimal("1")
        )
    ):
        return BufferRiskResult(
            risk_level="HIGH",
            risk_type="EMPTY_BUFFER",
            buffer_percentage=_round(buffer_percentage),
            net_flow_tph=_round(net_flow_tph),
            hours_to_full=None,
            hours_to_empty=_round(hours_to_empty),
            recommended_action="INCREASE_UNLOADING_OR_REDUCE_PACKAGING",
            message=(
                "Buffer may become empty. Increase unloading or reduce packaging."
            ),
        )

    # Early warning before reaching a critical condition
    if (
        buffer_percentage >= Decimal("80")
        or (
            hours_to_full is not None
            and hours_to_full <= Decimal("2")
        )
    ):
        return BufferRiskResult(
            risk_level="MEDIUM",
            risk_type="HIGH_BUFFER",
            buffer_percentage=_round(buffer_percentage),
            net_flow_tph=_round(net_flow_tph),
            hours_to_full=_round(hours_to_full),
            hours_to_empty=None,
            recommended_action="MONITOR_AND_REDUCE_UNLOADING",
            message="Buffer level is increasing toward capacity.",
        )

    if (
        buffer_percentage <= Decimal("20")
        or (
            hours_to_empty is not None
            and hours_to_empty <= Decimal("2")
        )
    ):
        return BufferRiskResult(
            risk_level="MEDIUM",
            risk_type="LOW_BUFFER",
            buffer_percentage=_round(buffer_percentage),
            net_flow_tph=_round(net_flow_tph),
            hours_to_full=None,
            hours_to_empty=_round(hours_to_empty),
            recommended_action="MONITOR_AND_INCREASE_UNLOADING",
            message="Buffer level is decreasing toward empty.",
        )

    return BufferRiskResult(
        risk_level="LOW",
        risk_type="BALANCED",
        buffer_percentage=_round(buffer_percentage),
        net_flow_tph=_round(net_flow_tph),
        hours_to_full=_round(hours_to_full),
        hours_to_empty=_round(hours_to_empty),
        recommended_action="CONTINUE_AND_MONITOR",
        message="Buffer operation is currently within the safe range.",
    )