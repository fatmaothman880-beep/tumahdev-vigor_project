# VIGOR Smart Port Operations

Integrated React dashboard, Node authentication/AI gateway, and FastAPI/PostgreSQL operations backend for VIGOR Cement Works.

## Included features

- Executive summary and operations dashboards, fleet details, berth scheduling, voyage rotations, manufacturer queues, fuel, payments, alerts, reports, and history.
- Corporate login, role-based API access, registration approval, user administration, and audit history from the local vessel system.
- PostgreSQL operational-state persistence with revision conflicts, normalized vessels/visits/readings/delays, prediction and buffer monitoring, upcoming calls, site checklists, and atomic visit planning from `full-integration`.
- Grounded operations assistant with a local factual response and optional server-side Gemini enhancement.
- Live vessel tracking is removed: no tracking page, coordinate feed, position editor, tracking alerts, or position state. Voyage schedules and recorded operational readings remain.

## Start on Ubuntu

Requires Node.js 22+, Python, and a running PostgreSQL database. The web application
is served by Node/Express/Vite on **http://localhost:3000**. FastAPI on port 8000
provides the operations API and developer documentation, not the browser UI.

One-time setup from the repository root (preserve an existing `.env`):

```bash
cd ~/tumahdev-vigor_project
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
[ -f .env ] || cp .env.example .env
```

Set `DATABASE_URL` in `.env` to your existing PostgreSQL database, with a
URL-encoded password. Keep these gateway settings:

```dotenv
VITE_API_URL=/api/v1
VITE_USE_MOCK_API=false
HOST=127.0.0.1
PORT=3000
OPERATIONS_API_URL=http://127.0.0.1:8000/api/v1
AUTH_DATA_PATH=./data/auth.json
BACKEND_PORT=8000
API_PREFIX=/api/v1
```

Back up an existing database before upgrading, then apply migrations:

```bash
source .venv/bin/activate
alembic -c backend/alembic.ini upgrade head
```

For a new demonstration database only, optionally add the seed with
`PYTHONPATH=backend python -m app.database.seed`. Existing records do not need
reseeding. Back up PostgreSQL and `data/auth.json`, which holds accounts and audit history.

Check `ss -ltnp | grep -E ':3000|:8000'` before starting; reuse the correct existing
processes instead of starting duplicates.

Terminal 1 — backend:

```bash
cd ~/tumahdev-vigor_project
source .venv/bin/activate
PYTHONPATH=backend python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2 — Node gateway/frontend:

```bash
cd ~/tumahdev-vigor_project
npm run dev
```

Open **http://localhost:3000**. The browser sends authentication and operational
requests through the Node gateway. FastAPI must remain behind the gateway because
the gateway enforces authentication and authorization. `.env.docker` is not loaded
by these native startup commands; configure `.env` instead.

For the seeded local demonstration, use `admin@turkysgroup.co.tz`, `ceo@turkysgroup.co.tz`, `ops.dispatcher@turkysgroup.co.tz`, or `auditor@turkysgroup.co.tz` with password `Turkys@2025`. New registrations require administrator activation. Admin has full access, including user approvals, roles, and system settings. Vessel Operation may update operational records. Management has read-only dashboards, analytics, reports, and audit access; Viewer has read-only operational dashboards and reports. The quick role buttons sign in to these demonstration accounts.

Existing local accounts and cached sessions using the old Operations role are mapped to Vessel Operation automatically. For an existing optional MySQL account database, apply `database/migrations/20260917_vessel_operation_role.sql` before deploying; fresh installations use the updated schema and seed.

Set `AUTH_SECRET` to a generated secret to keep sessions valid across restarts. When omitted, a random process secret invalidates sessions on restart. These seeded credentials and quick login are for demonstration; replace them before a production rollout.

## Other native environments

The optional Windows helper is `npm run local:start`; it invokes the PowerShell
native startup script, not Docker. See [native runtime notes](docs/native-runtime.md).
`GEMINI_API_KEY` is optional and stays on the server. Without it the assistant uses
its factual local response.

`AUTH_DATA_PATH=./data/auth.json` persists accounts and audit history locally. The optional cPanel MySQL account adapter and SQL files are retained in `server/database.ts` and `database/`; PostgreSQL remains the operational database. See [integration notes](docs/full-integration.md) for limitations and verification.

## Verify

```bash
source .venv/bin/activate
npm run lint
npm run build
npm test
PYTHONPATH=backend python -m pytest backend/tests
```

Some backend tests require a running PostgreSQL instance. Set `TEST_DATABASE_URL` to a dedicated test database for isolated schema tests. The existing `tests/integration` suite calls a running FastAPI service. API documentation is at http://localhost:8000/docs for local development.

Health checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/health/database
curl http://127.0.0.1:8000/api/v1/health
```

A successful HTML response alone does not verify React. Confirm the corporate
Login page renders, then sign in and confirm the live dashboard loads.
If the page is blank, inspect the browser console and run `npm run lint` and
`npm run build`: missing module exports can stop React before Login mounts even
when every health endpoint is healthy.
