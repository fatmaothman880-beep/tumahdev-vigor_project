from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.frontend_state import FrontendOperationalState
from app.schemas.frontend_state import FrontendStateResponse, FrontendStateUpdate


router = APIRouter(prefix="/operations", tags=["Full-cycle Operations"])
STATE_KEY = "primary"


@router.get("/state", response_model=FrontendStateResponse)
def get_operational_state(db: Session = Depends(get_db)) -> FrontendStateResponse:
    record = db.get(FrontendOperationalState, STATE_KEY)
    if record is None:
        return FrontendStateResponse(state=None, revision=0, updated_at=None)
    return FrontendStateResponse(
        state=record.payload,
        revision=record.revision,
        updated_at=record.updated_at,
    )


@router.put("/state", response_model=FrontendStateResponse)
def update_operational_state(
    payload: FrontendStateUpdate,
    db: Session = Depends(get_db),
) -> FrontendStateResponse:
    record = db.scalar(
        select(FrontendOperationalState)
        .where(FrontendOperationalState.key == STATE_KEY)
        .with_for_update()
    )
    current_revision = record.revision if record else 0

    if payload.expected_revision is not None and payload.expected_revision != current_revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Operational state changed on another client.",
                "current_revision": current_revision,
            },
        )

    if record is None:
        record = FrontendOperationalState(
            key=STATE_KEY,
            payload=payload.state.model_dump(mode="json"),
            revision=1,
        )
        db.add(record)
    else:
        record.payload = payload.state.model_dump(mode="json")
        record.revision += 1

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Operational state was initialized by another client.",
        ) from exc
    db.refresh(record)
    return FrontendStateResponse(
        state=record.payload,
        revision=record.revision,
        updated_at=record.updated_at,
    )
