# Demo Deployment Runbook

Status: The frontend, backend and database are integrated in `full-integration`.
Runtime acceptance still requires a host with Docker Desktop or Python/PostgreSQL.

## Release inputs

- Record the exact Git commit to deploy.
- Use an approved demo host with Docker Compose or equivalent managed services.
- Supply secrets through the host environment; never upload `.env` to Git.
- Replace all `.env.example` demo credentials before any shared deployment.
- Restrict PostgreSQL port `5432` to the application network in staging.
- Confirm the application has no PLC/SCADA write or control interface.

## Deployment sequence

1. Check out the accepted `full-integration` commit on the demo host.
2. Configure environment values for database, backend URL, frontend URL, authentication and allowed origins.
3. Run `scripts/start-environment.ps1`; Compose builds and starts all services.
4. Confirm the backend startup applied migrations and seeded synthetic demo records.
5. Run the API/frontend smoke check.
6. Run strict integration tests against the deployed API.
7. Record results and execute the UAT checklist before accepting the environment.

Smoke check:

```powershell
$env:API_BASE_URL = 'https://api.demo.example/api/v1'
$env:FRONTEND_URL = 'https://demo.example'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Strict integration test:

```powershell
python -m pytest -m integration --require-api
```

Do not describe an environment as deployed until the smoke check passes and its URL, commit and timestamp are recorded below.

## Deployment record

| Field | Value |
| --- | --- |
| Status | Integrated; runtime acceptance pending |
| URL | Not assigned |
| Commit | Not deployed |
| Deployed at | Not executed |
| Smoke-test result | Not executed |
| Integration-test result | Not executed |
| Blocker | The current workstation has no running Docker engine or usable Python runtime |

## Rollback

1. Stop new write activity in the demo environment.
2. Restore the last accepted application commit and compatible database migration state.
3. Restore the database backup if the failed change modified demo data incompatibly.
4. Repeat smoke and integration tests before reopening the demo.
