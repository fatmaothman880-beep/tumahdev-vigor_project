# VIGOR Smart Port Operations

React dashboards, a Node login/AI gateway, and a FastAPI/PostgreSQL backend, running directly on Windows. No containers are required.

## Features

Executive and operations dashboards, fleet details, berth scheduling, voyage rotations, manufacturer queues, fuel, payments, alerts, reports, corporate login, user administration, and a grounded assistant. The backend retains PostgreSQL state persistence, revision checks, normalized visits/readings/delays, predictions, buffer monitoring, site checklists, and atomic visit planning. Live vessel tracking is removed.

The combined version also includes operational checklists with history, overdue tasks, a site registry, database visit entry, editable manufacturers/works, and calendar-based rotation filters. Existing future-berth configuration and expansion scenarios remain available. See [combined integration notes](docs/combined-integration.md).

## First-time setup

Install Node.js 22+, Python, and PostgreSQL. Open PowerShell at the repository root:

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --default-timeout=120 --retries=10 -r requirements-dev.txt
```

If `python` opens the Windows Store, use `py -3 -m venv .venv` or the full path of your installed Python executable.

Choose one database setup:

### Project-local PostgreSQL (recommended for development)

```powershell
.\.venv\Scripts\python.exe scripts/local_database.py setup
```

This uses installed PostgreSQL binaries to create `.local/postgres`, starts a separate instance bound to `127.0.0.1:55432`, creates `vigor_port` and `vigor_port_test`, and writes generated credentials/signing secret to ignored `.env`. It does not modify an existing Windows PostgreSQL service. Existing `.env` or local database files are never overwritten. Set `POSTGRES_BIN` if binaries are outside PATH and the standard Windows installation folder.

### Existing PostgreSQL server

Create a database and login using pgAdmin, copy `.env.example` to `.env`, and set `DATABASE_URL` to their connection string. URL-encode special characters in the password. Generate an `AUTH_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set the resulting value in `.env`. Keep `VITE_USE_MOCK_API=false` for the real backend.

## Start and stop

First start, including synthetic demonstration records:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-environment.ps1 -Seed
```

Subsequent starts:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-environment.ps1
```

The launcher starts the optional project-local database, applies migrations, starts FastAPI and Node in the background, and checks both the web page and PostgreSQL connection. If a service fails, it stops the application processes it launched. Logs are in `artifacts/*.log`.

Open http://localhost:3000. API documentation is at http://127.0.0.1:8000/docs for local development. The browser uses the Node gateway; keep FastAPI private because the gateway enforces authentication.

Demo login: `admin@turkysgroup.co.tz` / `Turkys@2025`. Management, Operations, and Viewer demo buttons are also available. Replace demonstration accounts before a production rollout.

Stop the application:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-environment.ps1
```

This stops only launcher-recorded processes whose IDs and start times still match. PostgreSQL remains running. To stop the optional project-local database too:

```powershell
.\.venv\Scripts\python.exe scripts/local_database.py stop
```

## Run manually to see the logs

Terminal 1:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2, repository root:

```powershell
npm run dev
```

Start PostgreSQL first. Press Ctrl+C in each terminal to stop those manually launched services.

## Persistence and backups

Operational records are in PostgreSQL. Local accounts and audit history are in `data/auth.json`. Back up both the database and this account file. Neither `.env`, `.local`, nor `data` belongs in Git.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup-database.ps1
```

This creates a PostgreSQL custom-format `.dump` under `artifacts/backups`. Restore into a separate database using pgAdmin's Restore action or `pg_restore`. The backup tool passes the password through the child environment, not its command-line arguments.

The optional MySQL account adapter is retained; it does not replace PostgreSQL operational storage. `GEMINI_API_KEY` optionally enables server-side AI enhancement; without it the assistant uses its local factual response.

## Checks

```powershell
npm run lint
npm run build
npm test
npm run test:workflow
npm run test:rotations
npm run test:preservation
$env:PYTHONPATH = 'backend'
.\.venv\Scripts\python.exe -m pytest backend/tests -q
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```

PostgreSQL integration tests require `TEST_DATABASE_URL` pointing to a dedicated database ending in `_test`. See [native runtime notes](docs/native-runtime.md) and [integration design](docs/full-integration.md).
