from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import (
    Berth,
    UpcomingCallStatus,
    UpcomingVesselCall,
    Vessel,
)
from app.schemas.upcoming_call import (
    UpcomingCallCreate,
    UpcomingCallResponse,
    UpcomingCallUpdate,
)


router = APIRouter(
    prefix="/upcoming-calls",
    tags=["Upcoming Vessel Calls"],
)


def get_call_or_404(
    db: Session,
    call_id: UUID,
) -> UpcomingVesselCall:
    upcoming_call = db.get(UpcomingVesselCall, call_id)

    if upcoming_call is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upcoming vessel call not found.",
        )

    return upcoming_call


def ensure_vessel_exists(
    db: Session,
    vessel_id: UUID,
) -> None:
    if db.get(Vessel, vessel_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vessel not found.",
        )


def ensure_berth_exists(
    db: Session,
    berth_id: UUID,
) -> None:
    if db.get(Berth, berth_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Berth not found.",
        )


def validate_call_schedule(
    expected_arrival: datetime,
    call_alert_at: datetime | None,
    confirmation_due_at: datetime | None,
) -> None:
    if (
        call_alert_at is not None
        and call_alert_at > expected_arrival
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Call alert time cannot be after expected arrival."
            ),
        )

    if (
        confirmation_due_at is not None
        and confirmation_due_at > expected_arrival
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Confirmation due time cannot be after "
                "expected arrival."
            ),
        )


@router.post(
    "",
    response_model=UpcomingCallResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_upcoming_call(
    payload: UpcomingCallCreate,
    db: Session = Depends(get_db),
) -> UpcomingVesselCall:
    ensure_vessel_exists(db, payload.vessel_id)
    ensure_berth_exists(db, payload.berth_id)

    upcoming_call = UpcomingVesselCall(
        **payload.model_dump()
    )

    db.add(upcoming_call)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upcoming vessel call contains invalid values.",
        ) from exc

    db.refresh(upcoming_call)
    return upcoming_call


@router.get(
    "",
    response_model=list[UpcomingCallResponse],
)
def list_upcoming_calls(
    call_status: UpcomingCallStatus | None = Query(default=None),
    berth_id: UUID | None = Query(default=None),
    from_time: datetime | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[UpcomingVesselCall]:
    query = select(UpcomingVesselCall)

    if call_status is not None:
        query = query.where(
            UpcomingVesselCall.status == call_status
        )

    if berth_id is not None:
        query = query.where(
            UpcomingVesselCall.berth_id == berth_id
        )

    if from_time is not None:
        query = query.where(
            UpcomingVesselCall.expected_arrival >= from_time
        )

    calls = db.scalars(
        query
        .order_by(UpcomingVesselCall.expected_arrival.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(calls)


@router.get(
    "/{call_id}",
    response_model=UpcomingCallResponse,
)
def get_upcoming_call(
    call_id: UUID,
    db: Session = Depends(get_db),
) -> UpcomingVesselCall:
    return get_call_or_404(db, call_id)


@router.patch(
    "/{call_id}",
    response_model=UpcomingCallResponse,
)
def update_upcoming_call(
    call_id: UUID,
    payload: UpcomingCallUpdate,
    db: Session = Depends(get_db),
) -> UpcomingVesselCall:
    upcoming_call = get_call_or_404(db, call_id)
    updates = payload.model_dump(exclude_unset=True)

    if (
        "berth_id" in updates
        and updates["berth_id"] is not None
    ):
        ensure_berth_exists(db, updates["berth_id"])

    expected_arrival = updates.get(
        "expected_arrival",
        upcoming_call.expected_arrival,
    )
    call_alert_at = updates.get(
        "call_alert_at",
        upcoming_call.call_alert_at,
    )
    confirmation_due_at = updates.get(
        "confirmation_due_at",
        upcoming_call.confirmation_due_at,
    )

    validate_call_schedule(
        expected_arrival=expected_arrival,
        call_alert_at=call_alert_at,
        confirmation_due_at=confirmation_due_at,
    )

    for field, value in updates.items():
        setattr(upcoming_call, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upcoming vessel call contains invalid values.",
        ) from exc

    db.refresh(upcoming_call)
    return upcoming_call