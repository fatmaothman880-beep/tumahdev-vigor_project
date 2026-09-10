from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FullCycleOperationalState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    vessels: list[dict[str, Any]]
    berths: list[dict[str, Any]]
    voyages: list[dict[str, Any]]
    fuelOperations: list[dict[str, Any]]
    paymentAccounts: list[dict[str, Any]]
    paymentTransactions: list[dict[str, Any]]
    vesselPositions: list[dict[str, Any]]
    manufacturerQueue: list[dict[str, Any]]
    operationalReadings: list[dict[str, Any]]
    delayEvents: list[dict[str, Any]]
    systemSettings: dict[str, Any]


class FrontendStateUpdate(BaseModel):
    state: FullCycleOperationalState
    expected_revision: int | None = Field(default=None, ge=0)


class FrontendStateResponse(BaseModel):
    state: dict[str, Any] | None
    revision: int
    updated_at: datetime | None
