from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Vessel
from app.schemas.vessel import (
    VesselCreate,
    VesselResponse,
    VesselUpdate,
)


router = APIRouter(
    prefix="/vessels",
    tags=["Vessels"],
)


def get_vessel_or_404(
    db: Session,
    vessel_id: UUID,
) -> Vessel:
    vessel = db.get(Vessel, vessel_id)

    if vessel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vessel not found.",
        )

    return vessel


@router.post(
    "",
    response_model=VesselResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vessel(
    payload: VesselCreate,
    db: Session = Depends(get_db),
) -> Vessel:
    if payload.imo_reference is not None:
        existing_vessel = db.scalar(
            select(Vessel).where(
                Vessel.imo_reference == payload.imo_reference
            )
        )

        if existing_vessel is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vessel with this IMO reference already exists.",
            )

    vessel = Vessel(**payload.model_dump())
    db.add(vessel)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vessel could not be created.",
        ) from exc

    db.refresh(vessel)
    return vessel


@router.get(
    "",
    response_model=list[VesselResponse],
)
def list_vessels(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Vessel]:
    vessels = db.scalars(
        select(Vessel)
        .order_by(Vessel.name.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(vessels)


@router.get(
    "/{vessel_id}",
    response_model=VesselResponse,
)
def get_vessel(
    vessel_id: UUID,
    db: Session = Depends(get_db),
) -> Vessel:
    return get_vessel_or_404(db, vessel_id)


@router.patch(
    "/{vessel_id}",
    response_model=VesselResponse,
)
def update_vessel(
    vessel_id: UUID,
    payload: VesselUpdate,
    db: Session = Depends(get_db),
) -> Vessel:
    vessel = get_vessel_or_404(db, vessel_id)
    updates = payload.model_dump(exclude_unset=True)

    if "imo_reference" in updates:
        new_imo = updates["imo_reference"]

        if new_imo is not None:
            duplicate = db.scalar(
                select(Vessel).where(
                    Vessel.imo_reference == new_imo,
                    Vessel.id != vessel_id,
                )
            )

            if duplicate is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "A vessel with this IMO reference "
                        "already exists."
                    ),
                )

    for field, value in updates.items():
        setattr(vessel, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vessel could not be updated.",
        ) from exc

    db.refresh(vessel)
    return vessel