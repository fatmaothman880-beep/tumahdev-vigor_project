from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Port Monitoring System API"
    )
    assert response.json()["documentation"] == "/docs"


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "port-monitoring-api",
    }


def test_database_health_endpoint() -> None:
    response = client.get("/api/v1/health/database")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "database": "connected",
    }


def test_openapi_contains_main_routes() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    paths = response.json()["paths"]

    expected_paths = [
        "/api/v1/health",
        "/api/v1/vessels",
        "/api/v1/berths",
        "/api/v1/visits",
        "/api/v1/visits/{visit_id}/readings",
        "/api/v1/visits/{visit_id}/predictions",
        "/api/v1/dashboard/active",
        "/api/v1/upcoming-calls",
        "/api/v1/visits/{visit_id}/delays",
        "/api/v1/operations/state",
    ]

    for path in expected_paths:
        assert path in paths


def test_invalid_vessel_id_returns_validation_error() -> None:
    response = client.get(
        "/api/v1/vessels/not-a-valid-uuid"
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == (
        "VALIDATION_ERROR"
    )
