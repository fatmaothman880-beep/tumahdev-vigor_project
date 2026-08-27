from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.models import UpcomingCallStatus


class UpcomingCallCreate(BaseModel):
    vessel_id: UUID
    berth_id: UUID
    expected_arrival: datetime

    cargo_type: str = Field(min_length=1, max_length=100)
    cargo_quantity_t: Decimal = Field(
        gt=0,
        decimal_places=2,
    )
    expected_rate_tph: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    call_alert_at: datetime | None = None
    confirmation_due_at: datetime | None = None
    confirmed_at: datetime | None = None

    berth_preparation_minutes: int = Field(default=0, ge=0)
    status: UpcomingCallStatus = UpcomingCallStatus.PLANNED
    notes: str | None = None

    @model_validator(mode="after")
    def validate_schedule(self):
        if (
            self.call_alert_at is not None
            and self.call_alert_at > self.expected_arrival
        ):
            raise ValueError(
                "Call alert time cannot be after expected arrival."
            )

        if (
            self.confirmation_due_at is not None
            and self.confirmation_due_at > self.expected_arrival
        ):
            raise ValueError(
                "Confirmation due time cannot be after expected arrival."
            )

        return self


class UpcomingCallUpdate(BaseModel):
    berth_id: UUID | None = None
    expected_arrival: datetime | None = None

    cargo_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    cargo_quantity_t: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    expected_rate_tph: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    call_alert_at: datetime | None = None
    confirmation_due_at: datetime | None = None
    confirmed_at: datetime | None = None

    berth_preparation_minutes: int | None = Field(
        default=None,
        ge=0,
    )
    status: UpcomingCallStatus | None = None
    notes: str | None = None


class UpcomingCallResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vessel_id: UUID
    berth_id: UUID
    expected_arrival: datetime

    cargo_type: str
    cargo_quantity_t: Decimal
    expected_rate_tph: Decimal | None

    call_alert_at: datetime | None
    confirmation_due_at: datetime | None
    confirmed_at: datetime | None

    berth_preparation_minutes: int
    status: UpcomingCallStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime