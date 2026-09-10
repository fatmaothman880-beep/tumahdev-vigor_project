# Full Integration Architecture

The `full-integration` branch treats the repository-root React application as
the frontend reference and adds the FastAPI/PostgreSQL implementation from
`intergration-branch` around it. No frontend page or feature is removed.

## Runtime flow

```text
Browser :3000
    -> Nginx static frontend
    -> /api/v1 reverse proxy
    -> FastAPI :8000
    -> PostgreSQL :5432
```

FastAPI owns normalized vessel, berth, visit, reading, prediction, delay,
upcoming-call, and operational-checklist records. The larger frontend model has
additional voyage-cycle, fuel, treasury, tracking, and manufacturer-queue
fields. Those are persisted in PostgreSQL through the versioned
`/api/v1/operations/state` integration contract.

On the first connected browser session, the complete frontend baseline is
stored without dropping any UI-owned fields. Backend vessel and berth records
are merged into that baseline. Later sessions hydrate from PostgreSQL. Every
frontend mutation is debounced and saved with an expected revision; stale
clients receive HTTP 409 instead of silently overwriting newer work.

## Service checks

- Frontend: `http://localhost:3000`
- API documentation: `http://localhost:8000/docs`
- API health: `http://localhost:8000/api/v1/health`
- Database health: `http://localhost:8000/api/v1/health/database`
- Full-cycle state: `http://localhost:8000/api/v1/operations/state`

Run `scripts/start-environment.ps1` to build and start the whole stack. Run
`scripts/smoke-test.ps1` after startup, then run
`python -m pytest -m integration --require-api` for the live API checks.
