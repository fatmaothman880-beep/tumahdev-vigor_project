import pytest


pytestmark = pytest.mark.integration


def test_health_endpoint_returns_ok(health_response: dict) -> None:
    assert health_response["status_code"] == 200
    assert health_response["payload"] == {"status": "ok"}
