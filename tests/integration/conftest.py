import json
import os
import urllib.error
import urllib.request

import pytest


def pytest_addoption(parser: pytest.Parser) -> None:
    group = parser.getgroup("smart-port-api")
    group.addoption(
        "--api-base-url",
        default=os.getenv("API_BASE_URL", "http://localhost:8000"),
        help="Base URL of the running Smart Port API.",
    )
    group.addoption(
        "--require-api",
        action="store_true",
        default=False,
        help="Fail instead of skip when the API cannot be reached.",
    )


@pytest.fixture(scope="session")
def api_base_url(pytestconfig: pytest.Config) -> str:
    return str(pytestconfig.getoption("--api-base-url")).rstrip("/")


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
