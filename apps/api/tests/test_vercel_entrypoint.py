from app.main import app
from index import app as vercel_app


def test_vercel_entrypoint_exports_the_existing_fastapi_app() -> None:
    assert vercel_app is app
