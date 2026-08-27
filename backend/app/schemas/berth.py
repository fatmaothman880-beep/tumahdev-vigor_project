from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import BerthStatus


class BerthCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    status: BerthStatus = BerthStatus.AVAILABLE


class BerthUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    status: BerthStatus | None = None


class BerthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: BerthStatus
    created_at: datetime
    updated_at: datetime