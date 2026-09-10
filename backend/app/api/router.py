from fastapi import APIRouter

from app.api.routes.berths import router as berths_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.predictions import router as predictions_router
from app.api.routes.readings import router as readings_router
from app.api.routes.vessels import router as vessels_router
from app.api.routes.visits import router as visits_router
from app.api.routes.upcoming_calls import router as upcoming_calls_router
from app.api.routes.delays import router as delays_router
from app.api.routes.operations import router as operations_router
api_router = APIRouter()
from app.api.routes.workflow import router as workflow_router
api_router.include_router(workflow_router)
from app.api.routes.integration import router as integration_router
api_router.include_router(integration_router)
api_router.include_router(health_router)
api_router.include_router(vessels_router)
api_router.include_router(berths_router)
api_router.include_router(visits_router)
api_router.include_router(readings_router)
api_router.include_router(predictions_router)
api_router.include_router(dashboard_router)
api_router.include_router(upcoming_calls_router)
api_router.include_router(delays_router)
api_router.include_router(operations_router)
