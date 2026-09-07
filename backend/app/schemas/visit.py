from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import VisitStatus


class VesselVisitCreate(BaseModel):
    planned_unload_start: datetime | None = None
    planned_completion: datetime | None = None
    planned_rate_tph: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    vessel_id: UUID
    berth_id: UUID
    cargo_type: str = Field(min_length=1, max_length=100)
    cargo_total_t: Decimal = Field(gt=0, decimal_places=2)

    planned_arrival: datetime | None = None
    actual_arrival: datetime | None = None
    unload_start: datetime | None = None
    unload_end: datetime | None = None
    planned_departure: datetime | None = None
    actual_departure: datetime | None = None

    post_unloading_minutes: int = Field(default=45, ge=0)
    status: VisitStatus = VisitStatus.PLANNED
    notes: str | None = None


class VesselVisitUpdate(BaseModel):
    planned_unload_start: datetime | None = None
    planned_completion: datetime | None = None
    planned_rate_tph: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    berth_id: UUID | None = None
    cargo_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    cargo_total_t: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    planned_arrival: datetime | None = None
    actual_arrival: datetime | None = None
    unload_start: datetime | None = None
    unload_end: datetime | None = None
    planned_departure: datetime | None = None
    actual_departure: datetime | None = None

    post_unloading_minutes: int | None = Field(
        default=None,
        ge=0,
    )
    status: VisitStatus | None = None
    notes: str | None = None


class VesselVisitResponse(BaseModel):
    planned_unload_start: datetime | None
    planned_completion: datetime | None
    planned_rate_tph: Decimal | None
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vessel_id: UUID
    berth_id: UUID
    cargo_type: str
    cargo_total_t: Decimal

    planned_arrival: datetime | None
    actual_arrival: datetime | None
    unload_start: datetime | None
    unload_end: datetime | None
    planned_departure: datetime | None
    actual_departure: datetime | None

    post_unloading_minutes: int
    status: VisitStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
