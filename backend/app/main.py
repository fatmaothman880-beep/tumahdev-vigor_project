from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        description=(
            "API for vessel unloading, packaging, buffer monitoring, "
            "predictions and berth planning."
        ),
    )
    register_exception_handlers(application)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(
        api_router,
        prefix=settings.api_prefix,
    )

    @application.get(
        "/",
        tags=["Root"],
    )
    def root() -> dict[str, str]:
        return {
            "message": "Port Monitoring System API",
            "documentation": "/docs",
            "health": f"{settings.api_prefix}/health",
        }

    return application


app = create_application()