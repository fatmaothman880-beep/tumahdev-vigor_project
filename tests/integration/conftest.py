import json
import os
import urllib.error
import urllib.request

import pytest

from api_client import ApiClient


def pytest_addoption(parser: pytest.Parser) -> None:
    group = parser.getgroup("smart-port-api")
    group.addoption(
        "--api-base-url",
        default=os.getenv("API_BASE_URL", "http://localhost:8000/api/v1"),
        help="Base URL of the running Smart Port API.",
    )
    group.addoption(
        "--require-api",
        action="store_true",
        default=False,
        help="Fail instead of skip when the API cannot be reached.",
    )
    group.addoption(
        "--test-vessel-id",
        default=os.getenv("TEST_VESSEL_ID"),
        help="ID of a seeded vessel available for workflow tests.",
    )
    group.addoption(
        "--test-berth-id",
        default=os.getenv("TEST_BERTH_ID"),
        help="ID of a seeded berth available for workflow tests.",
    )
    group.addoption(
        "--test-next-vessel-id",
        default=os.getenv("TEST_NEXT_VESSEL_ID"),
        help="ID of a second seeded vessel used for berth-conflict tests.",
    )


@pytest.fixture(scope="session")
def api_base_url(pytestconfig: pytest.Config) -> str:
    return str(pytestconfig.getoption("--api-base-url")).rstrip("/")


@pytest.fixture(scope="session")
def api_client(api_base_url: str) -> ApiClient:
    return ApiClient(api_base_url)


@pytest.fixture(scope="session")
def seeded_ids(pytestconfig: pytest.Config) -> dict[str, str]:
    vessel_id = pytestconfig.getoption("--test-vessel-id")
    berth_id = pytestconfig.getoption("--test-berth-id")
    next_vessel_id = pytestconfig.getoption("--test-next-vessel-id")
    if vessel_id and berth_id and next_vessel_id:
        return {
            "vessel_id": str(vessel_id),
            "berth_id": str(berth_id),
            "next_vessel_id": str(next_vessel_id),
        }

    message = (
        "Workflow tests require TEST_VESSEL_ID, TEST_NEXT_VESSEL_ID and "
        "TEST_BERTH_ID from seeded data."
    )
    if pytestconfig.getoption("--require-api"):
        pytest.fail(message)
    pytest.skip(message)


@pytest.fixture(scope="session")
def health_response(api_base_url: str, pytestconfig: pytest.Config) -> dict:
    url = f"{api_base_url}/health"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            status_code = response.status
            payload = json.load(response)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        message = f"Smart Port API is unavailable or returned invalid JSON at {url}: {exc}"
        if pytestconfig.getoption("--require-api"):
            pytest.fail(message)
        pytest.skip(message)

    return {"status_code": status_code, "payload": payload}
