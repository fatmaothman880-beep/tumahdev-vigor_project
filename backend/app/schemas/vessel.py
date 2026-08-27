from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VesselCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    imo_reference: str | None = Field(
        default=None,
        max_length=20,
    )
    capacity_t: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    agent_name: str | None = Field(
        default=None,
        max_length=150,
    )
    agent_phone: str | None = Field(
        default=None,
        max_length=30,
    )


class VesselUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    imo_reference: str | None = Field(
        default=None,
        max_length=20,
    )
    capacity_t: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    agent_name: str | None = Field(
        default=None,
        max_length=150,
    )
    agent_phone: str | None = Field(
        default=None,
        max_length=30,
    )


class VesselResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    imo_reference: str | None
    capacity_t: Decimal | None
    agent_name: str | None
    agent_phone: str | None
    created_at: datetime
    updated_at: datetime