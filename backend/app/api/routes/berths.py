from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Berth
from app.schemas.berth import (
    BerthCreate,
    BerthResponse,
    BerthUpdate,
)


router = APIRouter(
    prefix="/berths",
    tags=["Berths"],
)


def get_berth_or_404(
    db: Session,
    berth_id: UUID,
) -> Berth:
    berth = db.get(Berth, berth_id)

    if berth is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Berth not found.",
        )

    return berth


@router.post(
    "",
    response_model=BerthResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_berth(
    payload: BerthCreate,
    db: Session = Depends(get_db),
) -> Berth:
    duplicate = db.scalar(
        select(Berth).where(Berth.name == payload.name)
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A berth with this name already exists.",
        )

    berth = Berth(**payload.model_dump())
    db.add(berth)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Berth could not be created.",
        ) from exc

    db.refresh(berth)
    return berth


@router.get(
    "",
    response_model=list[BerthResponse],
)
def list_berths(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Berth]:
    berths = db.scalars(
        select(Berth)
        .order_by(Berth.name.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(berths)


@router.get(
    "/{berth_id}",
    response_model=BerthResponse,
)
def get_berth(
    berth_id: UUID,
    db: Session = Depends(get_db),
) -> Berth:
    return get_berth_or_404(db, berth_id)


@router.patch(
    "/{berth_id}",
    response_model=BerthResponse,
)
def update_berth(
    berth_id: UUID,
    payload: BerthUpdate,
    db: Session = Depends(get_db),
) -> Berth:
    berth = get_berth_or_404(db, berth_id)
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates:
        duplicate = db.scalar(
            select(Berth).where(
                Berth.name == updates["name"],
                Berth.id != berth_id,
            )
        )

        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A berth with this name already exists.",
            )

    for field, value in updates.items():
        setattr(berth, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Berth could not be updated.",
        ) from exc

    db.refresh(berth)
    return berth