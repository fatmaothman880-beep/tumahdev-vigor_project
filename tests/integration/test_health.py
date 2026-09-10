import pytest


pytestmark = pytest.mark.integration


def test_health_endpoint_returns_ok(health_response: dict) -> None:
    assert health_response["status_code"] == 200
    assert health_response["payload"] == {
        "status": "healthy",
        "service": "port-monitoring-api",
    }


def test_full_cycle_state_endpoint_is_available(api_client) -> None:
    response = api_client.request_object("GET", "/operations/state")
    assert response["revision"] >= 0
    assert response["state"] is None or isinstance(response["state"], dict)
