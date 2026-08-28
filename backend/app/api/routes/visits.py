from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import (
    Berth,
    Vessel,
    VesselVisit,
    VisitStatus,
)
from app.schemas.visit import (
    VesselVisitCreate,
    VesselVisitResponse,
    VesselVisitUpdate,
)


router = APIRouter(
    prefix="/visits",
    tags=["Vessel Visits"],
)


def get_visit_or_404(
    db: Session,
    visit_id: UUID,
) -> VesselVisit:
    visit = db.get(VesselVisit, visit_id)

    if visit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vessel visit not found.",
        )

    return visit


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


@router.post(
    "",
    response_model=VesselVisitResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visit(
    payload: VesselVisitCreate,
    db: Session = Depends(get_db),
) -> VesselVisit:
    ensure_vessel_exists(db, payload.vessel_id)
    ensure_berth_exists(db, payload.berth_id)

    visit = VesselVisit(**payload.model_dump())
    db.add(visit)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Vessel visit contains invalid values.",
        ) from exc

    db.refresh(visit)
    return visit


@router.get(
    "",
    response_model=list[VesselVisitResponse],
)
def list_visits(
    visit_status: VisitStatus | None = Query(default=None),
    vessel_id: UUID | None = Query(default=None),
    berth_id: UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[VesselVisit]:
    query = select(VesselVisit)

    if visit_status is not None:
        query = query.where(
            VesselVisit.status == visit_status
        )

    if vessel_id is not None:
        query = query.where(
            VesselVisit.vessel_id == vessel_id
        )

    if berth_id is not None:
        query = query.where(
            VesselVisit.berth_id == berth_id
        )

    visits = db.scalars(
        query
        .order_by(VesselVisit.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(visits)


@router.get(
    "/{visit_id}",
    response_model=VesselVisitResponse,
)
def get_visit(
    visit_id: UUID,
    db: Session = Depends(get_db),
) -> VesselVisit:
    return get_visit_or_404(db, visit_id)


@router.patch(
    "/{visit_id}",
    response_model=VesselVisitResponse,
)
def update_visit(
    visit_id: UUID,
    payload: VesselVisitUpdate,
    db: Session = Depends(get_db),
) -> VesselVisit:
    visit = get_visit_or_404(db, visit_id)
    updates = payload.model_dump(exclude_unset=True)

    if (
        "berth_id" in updates
        and updates["berth_id"] is not None
    ):
        ensure_berth_exists(db, updates["berth_id"])

    for field, value in updates.items():
        setattr(visit, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Vessel visit contains invalid values.",
        ) from exc

    db.refresh(visit)
    return visit