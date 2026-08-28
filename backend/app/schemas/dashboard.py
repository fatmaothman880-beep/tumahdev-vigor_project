from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    visit_id: UUID
    vessel_name: str
    berth_name: str
    cargo_type: str
    cargo_total_t: Decimal
    visit_status: str

    recorded_at: datetime | None
    unloaded_t: Decimal
    remaining_t: Decimal
    progress_pct: Decimal
    unloading_rate_tph: Decimal | None
    unloading_status: str | None

    buffer_level_t: Decimal | None
    buffer_capacity_t: Decimal | None
    buffer_percentage: Decimal | None
    buffer_risk_level: str
    buffer_risk_type: str
    buffer_net_flow_tph: Decimal | None
    buffer_hours_to_full: Decimal | None
    buffer_hours_to_empty: Decimal | None
    buffer_recommended_action: str
    buffer_message: str

    packaging_rate_tph: Decimal | None
    packaging_status: str | None

    estimated_unload_finish: datetime | None
    expected_berth_release: datetime | None
    data_quality: str

    next_vessel_arrival: datetime | None
    berth_conflict: bool | None
    berth_risk_level: str
    berth_gap_minutes: int | None
    berth_message: str