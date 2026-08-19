from app.api.routes.health import health
from app.main import app


def test_health_handler_and_route_registration() -> None:
    response = health()
    registered_paths = set(app.openapi()["paths"])

    assert response.model_dump() == {"status": "ok", "service": "finpath-api"}
    assert "/health" in registered_paths
