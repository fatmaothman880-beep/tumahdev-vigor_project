<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This repository now contains the complete VIGOR Smart Port Operations stack:

- the existing React operations frontend at the repository root;
- the FastAPI and PostgreSQL backend integrated from `intergration-branch`;
- database migrations and demo seed data;
- durable synchronization for voyages, fuel, payments, tracking, manufacturer queues, readings, and delays;
- a Docker Compose setup that links the browser, API, and database.

## Run the integrated system

Prerequisites: Docker Desktop with Docker Compose.

```powershell
Copy-Item .env.example .env
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-environment.ps1
```

Open `http://localhost:3000`. API documentation is available at
`http://localhost:8000/docs`, and the health endpoint is
`http://localhost:8000/api/v1/health`.

The startup flow builds both applications, starts PostgreSQL, applies Alembic
migrations, seeds the normalized port-call demo, and serves the frontend through
Nginx. Requests to `/api/v1` are proxied to FastAPI, so the deployed frontend and
backend share one origin.

Stop the stack with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-environment.ps1
```

PostgreSQL data is kept in the `postgres_data` Docker volume between restarts.

## Run services separately

Start PostgreSQL with `docker compose up -d db`, then run:

```powershell
python -m pip install -r requirements.txt
Set-Location backend
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload --port 8000
```

In a second terminal, from the repository root:

```powershell
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when running the frontend separately. Set
`VITE_API_URL=http://localhost:8000/api/v1` and keep
`VITE_USE_MOCK_API=false` for the integrated backend.

## Data integration

The backend keeps vessels, berths, visits, unloading readings, forecasts, delays,
and upcoming calls in normalized tables. The frontend's wider full-cycle model is
stored by `GET/PUT /api/v1/operations/state` in PostgreSQL with revision checks.
This lets the existing interface retain every planning field while synchronizing
fuel, treasury, tracking, manufacturer queue, and voyage changes across sessions.
See [docs/full-integration.md](docs/full-integration.md) for the contract and
runtime flow.

## Frontend-only development

This contains everything needed to run the frontend locally.

View your app in AI Studio: https://ai.studio/apps/b98b0772-a3d5-42ce-a40d-051bc99c90dc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
