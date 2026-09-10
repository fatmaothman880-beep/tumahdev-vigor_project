from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Prediction, VesselVisit
from app.schemas.reading import PredictionSummary
from app.services.prediction_service import generate_prediction


router = APIRouter(
    prefix="/visits/{visit_id}/predictions",
    tags=["Predictions"],
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


@router.post(
    "",
    response_model=PredictionSummary,
    status_code=status.HTTP_201_CREATED,
)
def create_prediction(
    visit_id: UUID,
    db: Session = Depends(get_db),
) -> Prediction:
    ensure_visit_exists(db, visit_id)

    return generate_prediction(
        db=db,
        visit_id=visit_id,
    )


@router.get(
    "",
    response_model=list[PredictionSummary],
)
def list_predictions(
    visit_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Prediction]:
    ensure_visit_exists(db, visit_id)

    predictions = db.scalars(
        select(Prediction)
        .where(Prediction.visit_id == visit_id)
        .order_by(Prediction.generated_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(predictions)


@router.get(
    "/latest",
    response_model=PredictionSummary,
)
def get_latest_prediction(
    visit_id: UUID,
    db: Session = Depends(get_db),
) -> Prediction:
    ensure_visit_exists(db, visit_id)

    prediction = db.scalar(
        select(Prediction)
        .where(Prediction.visit_id == visit_id)
        .order_by(Prediction.generated_at.desc())
        .limit(1)
    )

    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction exists for this vessel visit.",
        )

    return prediction