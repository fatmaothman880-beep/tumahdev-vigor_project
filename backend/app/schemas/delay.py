from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DelayEventCreate(BaseModel):
    start_time: datetime
    end_time: datetime | None = None

    category: str = Field(min_length=1, max_length=50)
    cause: str = Field(min_length=1, max_length=150)
    responsible_area: str | None = Field(
        default=None,
        max_length=100,
    )
    equipment: str | None = Field(
        default=None,
        max_length=100,
    )
    description: str | None = None

    @model_validator(mode="after")
    def validate_times(self):
        if (
            self.end_time is not None
            and self.end_time < self.start_time
        ):
            raise ValueError(
                "Delay end time cannot be before start time."
            )

        return self


class DelayEventUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None

    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    cause: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    responsible_area: str | None = Field(
        default=None,
        max_length=100,
    )
    equipment: str | None = Field(
        default=None,
        max_length=100,
    )
    description: str | None = None


class DelayEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    start_time: datetime
    end_time: datetime | None

    category: str
    cause: str
    responsible_area: str | None
    equipment: str | None
    description: str | None
    created_at: datetime