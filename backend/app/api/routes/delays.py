from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import DelayEvent, VesselVisit
from app.schemas.delay import (
    DelayEventCreate,
    DelayEventResponse,
    DelayEventUpdate,
)


router = APIRouter(
    prefix="/visits/{visit_id}/delays",
    tags=["Delay Events"],
)


def ensure_visit_exists(
    db: Session,
    visit_id: UUID,
) -> None:
    if db.get(VesselVisit, visit_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vessel visit not found.",
        )


def get_delay_or_404(
    db: Session,
    visit_id: UUID,
    delay_id: UUID,
) -> DelayEvent:
    delay = db.scalar(
        select(DelayEvent).where(
            DelayEvent.id == delay_id,
            DelayEvent.visit_id == visit_id,
        )
    )

    if delay is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delay event not found.",
        )

    return delay


def validate_delay_times(
    start_time,
    end_time,
) -> None:
    if end_time is not None and end_time < start_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Delay end time cannot be before start time.",
        )


@router.post(
    "",
    response_model=DelayEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_delay(
    visit_id: UUID,
    payload: DelayEventCreate,
    db: Session = Depends(get_db),
) -> DelayEvent:
    ensure_visit_exists(db, visit_id)

    delay = DelayEvent(
        visit_id=visit_id,
        **payload.model_dump(),
    )

    db.add(delay)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Delay event contains invalid values.",
        ) from exc

    db.refresh(delay)
    return delay


@router.get(
    "",
    response_model=list[DelayEventResponse],
)
def list_delays(
    visit_id: UUID,
    category: str | None = Query(default=None),
    active_only: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[DelayEvent]:
    ensure_visit_exists(db, visit_id)

    query = select(DelayEvent).where(
        DelayEvent.visit_id == visit_id
    )

    if category is not None:
        query = query.where(
            DelayEvent.category == category
        )

    if active_only:
        query = query.where(
            DelayEvent.end_time.is_(None)
        )

    delays = db.scalars(
        query
        .order_by(DelayEvent.start_time.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(delays)


@router.get(
    "/{delay_id}",
    response_model=DelayEventResponse,
)
def get_delay(
    visit_id: UUID,
    delay_id: UUID,
    db: Session = Depends(get_db),
) -> DelayEvent:
    return get_delay_or_404(
        db,
        visit_id,
        delay_id,
    )


@router.patch(
    "/{delay_id}",
    response_model=DelayEventResponse,
)
def update_delay(
    visit_id: UUID,
    delay_id: UUID,
    payload: DelayEventUpdate,
    db: Session = Depends(get_db),
) -> DelayEvent:
    delay = get_delay_or_404(
        db,
        visit_id,
        delay_id,
    )

    updates = payload.model_dump(exclude_unset=True)

    start_time = updates.get(
        "start_time",
        delay.start_time,
    )
    end_time = updates.get(
        "end_time",
        delay.end_time,
    )

    validate_delay_times(
        start_time=start_time,
        end_time=end_time,
    )

    for field, value in updates.items():
        setattr(delay, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Delay event contains invalid values.",
        ) from exc

    db.refresh(delay)
    return delay