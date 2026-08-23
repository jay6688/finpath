"""Vercel ASGI entrypoint for the existing FinPath FastAPI application."""

from app.main import app


__all__ = ["app"]
