# VIGOR Smart Port Operations

Integrated React dashboard, Node authentication/AI gateway, and FastAPI/PostgreSQL operations backend for VIGOR Cement Works.

## Included features

- Executive summary and operations dashboards, fleet details, berth scheduling, voyage rotations, manufacturer queues, fuel, payments, alerts, reports, and history.
- Corporate login, role-based API access, registration approval, user administration, and audit history from the local vessel system.
- PostgreSQL operational-state persistence with revision conflicts, normalized vessels/visits/readings/delays, prediction and buffer monitoring, upcoming calls, site checklists, and atomic visit planning from `full-integration`.
- Grounded operations assistant with a local factual response and optional server-side Gemini enhancement.
- Live vessel tracking is removed: no tracking page, coordinate feed, position editor, tracking alerts, or position state. Voyage schedules and recorded operational readings remain.

## Start with Docker

Install and start Docker Desktop, then run:

```powershell
Copy-Item .env.example .env
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-environment.ps1
```

Open http://localhost:3000. The browser uses the Node gateway on this port for both authentication and operational API requests. PostgreSQL and FastAPI ports are bound to loopback for local maintenance; do not expose FastAPI directly as the public application API because authentication is enforced by the gateway.

Startup applies all Alembic migrations, including removal of old position data, and runs the existing seed. Back up existing databases before upgrading. PostgreSQL data lives in `postgres_data`; local accounts and audit history live in `auth_data`. Keep both volumes when stopping the stack.

For the seeded local demonstration, use `admin@turkysgroup.co.tz`, `ceo@turkysgroup.co.tz`, `ops.dispatcher@turkysgroup.co.tz`, or `auditor@turkysgroup.co.tz` with password `Turkys@2025`. New registrations require administrator activation. Admin and Operations may write operational data; Management and Viewer may read it. The quick role buttons sign in to these demonstration accounts.

Set `AUTH_SECRET` to a generated secret to keep sessions valid across restarts. When omitted, a random process secret invalidates sessions on restart. These seeded credentials and quick login are for demonstration; replace them before a production rollout.

## Run separately

Requires Node.js 22+, Python, and PostgreSQL. Copy `.env.example` to `.env` and configure `DATABASE_URL` for your database.

```powershell
npm ci
python -m pip install -r requirements-dev.txt
Set-Location backend
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload --port 8000
```

In a second terminal at the repository root, run `npm run dev`. Keep `VITE_API_URL=/api/v1` and `OPERATIONS_API_URL=http://127.0.0.1:8000/api/v1`. The gateway serves the browser on port 3000. `GEMINI_API_KEY` is optional and stays on the server. Without it the assistant uses its factual local response.

`AUTH_DATA_PATH=./data/auth.json` persists accounts and audit history locally. The optional cPanel MySQL account adapter and SQL files are retained in `server/database.ts` and `database/`; PostgreSQL remains the operational database. See [integration notes](docs/full-integration.md) for limitations and verification.

## Verify

```powershell
npm run lint
npm run build
npm test
$env:PYTHONPATH = 'backend'
python -m pytest backend/tests
```

Some backend tests require a running PostgreSQL instance. Set `TEST_DATABASE_URL` to a dedicated test database for isolated schema tests. The existing `tests/integration` suite calls a running FastAPI service. API documentation is at http://localhost:8000/docs for local development.
