from fastapi import FastAPI

from app.api.routes.health import router as health_router


app = FastAPI(
    title="FinPath API",
    version="0.1.0",
    description="Normalized, source-linked public financial data for FinPath.",
)
app.include_router(health_router)

