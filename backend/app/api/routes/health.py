from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.session import get_db
from fastapi import Depends


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "port-monitoring-api",
    }


@router.get("/database")
def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }