import os

from fastapi import FastAPI

from app.api.routes.companies import router as companies_router
from app.api.routes.health import router as health_router


def _docs_are_enabled() -> bool:
    raw_value = os.getenv("FINPATH_API_DOCS_ENABLED", "true")
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def create_app(*, docs_enabled: bool | None = None) -> FastAPI:
    """Create the API while keeping local docs optional in public deployments."""

    show_docs = _docs_are_enabled() if docs_enabled is None else docs_enabled
    app = FastAPI(
        title="FinPath API",
        version="0.1.0",
        description="Normalized, source-linked public financial data for FinPath.",
        docs_url="/docs" if show_docs else None,
        redoc_url="/redoc" if show_docs else None,
        openapi_url="/openapi.json" if show_docs else None,
    )
    app.include_router(health_router)
    app.include_router(companies_router)
    return app


app = create_app()
