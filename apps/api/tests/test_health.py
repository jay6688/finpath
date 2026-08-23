from app.api.routes.health import health
from app.main import app, create_app


def test_health_handler_and_route_registration() -> None:
    response = health()
    registered_paths = set(app.openapi()["paths"])

    assert response.model_dump() == {"status": "ok", "service": "finpath-api"}
    assert "/health" in registered_paths
    assert "/v1/companies/{ticker}/overview" in registered_paths


def test_public_deployment_can_disable_interactive_api_docs() -> None:
    public_app = create_app(docs_enabled=False)
    registered_paths = set(public_app.openapi()["paths"])

    assert "/health" in registered_paths
    assert "/v1/companies/{ticker}/overview" in registered_paths
    assert public_app.docs_url is None
    assert public_app.redoc_url is None
    assert public_app.openapi_url is None
