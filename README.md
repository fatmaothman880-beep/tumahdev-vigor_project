# Smart Port MVP 1

Smart Port MVP 1 is a one-week, semi-manual operations dashboard prototype. It records vessel visits, unloading readings and delays, then exposes transparent ETA and berth-conflict information.

The MVP is decision-support software only. It must not send write or control commands to PLC, SCADA or other industrial equipment.

## Day 1 status

The repository workflow, pull-request checklist, environment skeleton and initial API contract are defined. Application services will be added by the frontend, backend and data workstreams.

## Branch workflow

- `main`: accepted releases only.
- `develop`: daily integration branch.
- `M1-Frontend-&-UX-Lead`: frontend and UX work.
- `M2-Backend-&-API-Lead`: backend and API work.
- `M3-Database,-Data-Quality-&-Prediction-Lead`: database and prediction work.
- `M4-QA,-Integration,-DevOps-&-Reporting-Lead`: QA, integration, DevOps and reporting work.

Open feature pull requests into `develop`. Test integrated changes there before opening the final release pull request from `develop` into `main`. See [docs/repository-workflow.md](docs/repository-workflow.md).

## Environment skeleton

Prerequisites:

- Git
- Docker Desktop with Docker Compose

Start the shared PostgreSQL database:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-environment.ps1
```

Stop it with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-environment.ps1
```

To also remove local database data, use `docker compose down -v`. This is destructive and should only be used when a clean database is intentional.

The backend and frontend Compose services will be added after their application shells and Dockerfiles exist. Until then, their expected ports and URLs are recorded in `.env.example` and [docs/api-contract.md](docs/api-contract.md).

## Integration tests

Create a virtual environment and install the test dependency:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

Run the integration scaffold:

```powershell
python -m pytest -m integration
```

When the backend is required to be running, use strict mode so an unreachable API fails instead of skipping:

```powershell
python -m pytest -m integration --require-api
```

The default API URL is `http://localhost:8000`. Override it with `API_BASE_URL` or `--api-base-url`. See [tests/integration/README.md](tests/integration/README.md).

## Vessel report export

After completing a visit, export its management report from the API:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-vessel-report.ps1 -VisitId '<visit-id>'
```

Generated reports are written under `artifacts/` by default and are not committed. See [docs/report-contract.md](docs/report-contract.md).

## Day 6 release checks

Run the tracked-file security audit:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\security-check.ps1
```

After deploying the integrated application, run the API/frontend smoke check:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Deployment, security/continuity and UAT procedures are in `docs/deployment-runbook.md`, `docs/security-continuity-checklist.md` and `docs/uat-checklist.md`.

## Feature freeze and handover

Member 4 feature work is frozen. The timed demo, release gates and handover/backlog are documented in `docs/demo-script.md`, `docs/release-checklist.md` and `docs/handover.md`. Do not add stretch features while any P0 gate remains blocked.

Day 8 acceptance is recorded in `docs/final-acceptance.md`. The current outcome is **blocked, not released** because the integrated application and required runtime evidence are unavailable.

## Repository layout

```text
.github/                 Pull-request template
docs/                    Workflow, task board and shared API contract
sample_data/             Versioned, non-sensitive demo data
scripts/                 Environment and report commands
tests/integration/        API integration-test scaffold
compose.yaml             Repeatable PostgreSQL environment
.env.example             Safe configuration template
```

## Configuration rules

- Copy `.env.example` to `.env` for local development.
- Never commit `.env`, credentials, tokens or production data.
- Treat values in `.env.example` as demo defaults, not verified site facts.
- Use UTC ISO 8601 timestamps at API boundaries.

## Current limitations

- Frontend and backend application services are not yet present.
- Database migrations and seed records belong to the database workstream and are not yet present.
- API and schema contracts are initial Day 1 drafts pending team sign-off.
- Deployment, integration tests, UAT and rehearsal remain unexecuted until Members 1-3 are integrated and Docker/Python are runnable.
