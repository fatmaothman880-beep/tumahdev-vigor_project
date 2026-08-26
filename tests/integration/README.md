# API Integration Tests

These tests call a running Smart Port backend over HTTP. They do not import backend implementation code, so the same suite can target local, Compose or staging environments.

## Run locally

```powershell
python -m pytest -m integration
```

If the API is unavailable, the default local run skips API-dependent tests. Release and CI checks must use strict mode:

```powershell
python -m pytest -m integration --require-api
```

Target another environment with either form:

```powershell
$env:API_BASE_URL = 'https://staging.example.test'
python -m pytest -m integration --require-api

python -m pytest -m integration --api-base-url 'http://localhost:8000' --require-api
```

## Day 2 scope

The scaffold currently verifies the agreed `/health` response. Core workflow scenarios belong to T34 and will be added after vessel, reading, dashboard, delay and history endpoints are stable.
