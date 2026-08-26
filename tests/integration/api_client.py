import json
import urllib.error
import urllib.request
from typing import Any


class ApiError(AssertionError):
    pass


class ApiClient:
    def __init__(self, base_url: str, timeout: float = 10) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        expected_status: int = 200,
    ) -> Any:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            method=method,
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                status_code = response.status
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise ApiError(
                f"{method} {path} returned {exc.code}, expected {expected_status}: {body}"
            ) from exc

        if status_code != expected_status:
            raise ApiError(
                f"{method} {path} returned {status_code}, expected {expected_status}: {body}"
            )

        try:
            result = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ApiError(f"{method} {path} did not return valid JSON: {body}") from exc

        return result

    def request_object(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        expected_status: int = 200,
    ) -> dict[str, Any]:
        result = self.request(method, path, payload, expected_status)
        if not isinstance(result, dict):
            raise ApiError(f"{method} {path} must return a JSON object, got: {result!r}")
        return result

    def request_list(self, method: str, path: str) -> list[dict[str, Any]]:
        result = self.request(method, path)
        if not isinstance(result, list) or not all(isinstance(item, dict) for item in result):
            raise ApiError(f"{method} {path} must return a JSON object list, got: {result!r}")
        return result
