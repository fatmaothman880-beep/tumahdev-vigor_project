from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import (
    DataQuality,
    PackagingStatus,
    ReadingSource,
    UnloadingStatus,
)


class OperationalReadingCreate(BaseModel):
    recorded_at: datetime
    source: ReadingSource = ReadingSource.MANUAL

    unloaded_t: Decimal = Field(ge=0, decimal_places=2)
    observed_rate_tph: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    buffer_level_t: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )
    buffer_capacity_t: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    packaging_rate_tph: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    unloading_status: UnloadingStatus
    packaging_status: PackagingStatus | None = None
    notes: str | None = None


class OperationalReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    recorded_at: datetime
    source: ReadingSource

    unloaded_t: Decimal
    observed_rate_tph: Decimal | None
    buffer_level_t: Decimal | None
    buffer_capacity_t: Decimal | None
    packaging_rate_tph: Decimal | None

    unloading_status: UnloadingStatus
    packaging_status: PackagingStatus | None
    notes: str | None
    created_at: datetime


class PredictionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    generated_at: datetime
    remaining_t: Decimal
    progress_pct: Decimal
    effective_rate_tph: Decimal | None
    estimated_unload_finish: datetime | None
    expected_berth_release: datetime | None
    method: str
    data_quality: DataQuality


class ReadingCreatedResponse(BaseModel):
    reading: OperationalReadingResponse
    prediction: PredictionSummary
    warnings: list[str]