from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import OperationalReading, VesselVisit
from app.schemas.reading import (
    OperationalReadingCreate,
    OperationalReadingResponse,
    ReadingCreatedResponse,
)
from app.services.prediction_service import generate_prediction
from app.services.reading_validation import (
    validate_operational_reading,
)


router = APIRouter(
    prefix="/visits/{visit_id}/readings",
    tags=["Operational Readings"],
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


@router.post(
    "",
    response_model=ReadingCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reading(
    visit_id: UUID,
    payload: OperationalReadingCreate,
    db: Session = Depends(get_db),
) -> ReadingCreatedResponse:
    visit = get_visit_or_404(db, visit_id)

    previous_reading = db.scalar(
        select(OperationalReading)
        .where(OperationalReading.visit_id == visit_id)
        .order_by(OperationalReading.recorded_at.desc())
        .limit(1)
    )

    validation = validate_operational_reading(
        cargo_total_t=visit.cargo_total_t,
        recorded_at=payload.recorded_at,
        unloaded_t=payload.unloaded_t,
        observed_rate_tph=payload.observed_rate_tph,
        buffer_level_t=payload.buffer_level_t,
        buffer_capacity_t=payload.buffer_capacity_t,
        packaging_rate_tph=payload.packaging_rate_tph,
        previous_recorded_at=(
            previous_reading.recorded_at
            if previous_reading is not None
            else None
        ),
        previous_unloaded_t=(
            previous_reading.unloaded_t
            if previous_reading is not None
            else None
        ),
    )

    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Operational reading is invalid.",
                "errors": list(validation.errors),
                "warnings": list(validation.warnings),
            },
        )

    reading = OperationalReading(
        visit_id=visit_id,
        **payload.model_dump(),
    )

    db.add(reading)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A reading for this visit and recorded time "
                "already exists, or the values violate a constraint."
            ),
        ) from exc

    db.refresh(reading)

    prediction = generate_prediction(
        db=db,
        visit_id=visit_id,
    )

    return ReadingCreatedResponse(
        reading=reading,
        prediction=prediction,
        warnings=list(validation.warnings),
    )


@router.get(
    "",
    response_model=list[OperationalReadingResponse],
)
def list_readings(
    visit_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[OperationalReading]:
    get_visit_or_404(db, visit_id)

    readings = db.scalars(
        select(OperationalReading)
        .where(OperationalReading.visit_id == visit_id)
        .order_by(OperationalReading.recorded_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(readings)


@router.get(
    "/{reading_id}",
    response_model=OperationalReadingResponse,
)
def get_reading(
    visit_id: UUID,
    reading_id: UUID,
    db: Session = Depends(get_db),
) -> OperationalReading:
    reading = db.scalar(
        select(OperationalReading).where(
            OperationalReading.id == reading_id,
            OperationalReading.visit_id == visit_id,
        )
    )

    if reading is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operational reading not found.",
        )

    return reading