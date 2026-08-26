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
Copy-Item .env.example .env
docker compose up -d db
docker compose ps
```

Stop it with:

```powershell
docker compose down
```

To also remove local database data, use `docker compose down -v`. This is destructive and should only be used when a clean database is intentional.

The backend and frontend Compose services will be added after their application shells and Dockerfiles exist. Until then, their expected ports and URLs are recorded in `.env.example` and [docs/api-contract.md](docs/api-contract.md).

## Repository layout

```text
.github/                 Pull-request template
docs/                    Workflow, task board and shared API contract
sample_data/             Versioned, non-sensitive demo data
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
