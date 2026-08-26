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

Seeded vessel and berth IDs are required for the workflow test:

```powershell
$env:TEST_VESSEL_ID = 'replace-with-seeded-vessel-id'
$env:TEST_BERTH_ID = 'replace-with-seeded-berth-id'
python -m pytest -m integration --require-api
```

## Current scope

- Day 2 verifies the agreed `/health` response.
- Day 3 creates an active visit, adds two readings, and verifies dashboard progress, remaining cargo, positive rate, ETA and data-quality evidence.
- Delay, berth-conflict, completion and history scenarios will be added as those scheduled API slices stabilize.

The Day 3 test assumes `POST` creation returns HTTP 201 and the active-dashboard aggregate uses the proposed top-level fields in `docs/api-contract.md`. The team must resolve those contract points before treating a failure as an implementation defect.
