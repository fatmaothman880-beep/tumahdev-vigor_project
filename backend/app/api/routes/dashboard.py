from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import get_active_dashboard


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/active",
    response_model=DashboardResponse,
)
def active_dashboard(
    db: Session = Depends(get_db),
) -> dict:
    dashboard = get_active_dashboard(db)

    if dashboard is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active vessel visit was found.",
        )

    return asdict(dashboard)