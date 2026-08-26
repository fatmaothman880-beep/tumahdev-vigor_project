# Smart Port Operations — Frontend (MVP-1)

A frontend prototype for **Smart Port Operations**, built for **Vigor Cement
Works** (Turky's Group of Companies), Zanzibar.

This is a **semi-manual, presentation-ready operational decision-support
prototype** for monitoring vessel unloading at a cement port: tracking
progress, unloading rate, estimated completion, expected berth release, and
potential berth conflicts with the next scheduled vessel.

> **Scope note:** this is decision support only. It does not send commands
> to any PLC, SCADA system, or unloading machinery, and it does not use
> machine learning. The completion estimate is a simple, transparent
> calculation (`remaining cargo ÷ effective rate`) — see "Prediction logic"
> below.

---

## 1. What this project is

MVP-1 covers the full vessel-visit workflow end to end, running entirely on
**mock data** so it can be demonstrated with no backend running:

1. Create a vessel visit
2. Assign cargo and berth information
3. Enter manual unloading readings
4. View unloading progress, effective rate, and remaining cargo
5. View estimated completion (with a visible data-quality state)
6. View expected berth release and compare it against the next vessel's ETA
7. See a berth-conflict warning when one exists
8. Record delays / downtime
9. Review the operational event timeline
10. Complete a vessel visit
11. View completed visits in history
12. Generate a printable vessel summary report

## 2. Technology stack

- **React 18** + **TypeScript**
- **Vite** (dev server / build)
- **Tailwind CSS** for styling
- **lucide-react** for icons
- No state-management library, no router library — plain React state is
  enough for this MVP (see "Routing" below)

## 3. Install

```bash
npm install
```

## 4. Run

```bash
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`). The app
works immediately with **no backend, no database, and no internet access**
required — it starts in mock mode.

## 5. How mock mode works

All data lives in `src/mock/mockData.ts` (the seed data) and
`src/mock/mockServices.ts` (an in-memory service layer that mimics the
future backend's functions — `getVesselVisits`, `createVesselVisit`,
`addReading`, `addDelay`, `completeVesselVisit`, etc.).

`src/api/*.ts` is the layer every page and component actually calls. Each
file checks `VITE_USE_MOCK_API` and either:

- calls the mock service layer directly, or
- calls the real FastAPI backend via `src/api/client.ts`'s `apiFetch()`.

No component ever builds a URL or calls `fetch()` directly — everything
goes through `src/api/`, so switching from mock to real is a one-line
environment change, not a rewrite.

## 6. Configuring `VITE_API_URL`

Copy the example environment file:

```bash
cp .env.example .env
```

```bash
# .env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_API=true
```

Set `VITE_USE_MOCK_API=false` once the FastAPI backend below is running and
reachable at `VITE_API_URL`.

## 7. How the frontend will connect to the FastAPI backend

The eventual backend is FastAPI + PostgreSQL. The frontend is already
written against this contract:

```
GET    /health
GET    /vessel-visits
POST   /vessel-visits
GET    /vessel-visits/{id}
PATCH  /vessel-visits/{id}
POST   /vessel-visits/{id}/readings
GET    /vessel-visits/{id}/readings
POST   /vessel-visits/{id}/delays
GET    /vessel-visits/{id}/delays
GET    /dashboard/active
GET    /vessel-visits?status=completed
GET    /reports/vessel/{id}
```

`GET /dashboard/active` is expected to return (see
`src/types/index.ts#ActiveDashboardResponse`):

```json
{
  "visit_id": 12,
  "vessel_name": "MV Example",
  "status": "unloading",
  "cargo_total_t": 12500,
  "cargo_remaining_t": 4500,
  "progress_pct": 64.0,
  "effective_rate_tph": 475,
  "estimated_unload_finish": "2026-08-26T18:42:00Z",
  "expected_berth_release": "2026-08-26T18:58:00Z",
  "next_vessel_eta": "2026-08-26T18:47:00Z",
  "berth_risk": "low | conflict | unknown",
  "data_quality": "current | stale | insufficient",
  "last_update": "2026-08-26T07:42:00Z"
}
```

**Important:** the frontend does not own the prediction calculation. In
real mode, the backend computes progress, rate, ETA, berth release, and
berth-risk; the frontend only displays the result. `src/lib/prediction.ts`
is a lightweight mock-mode equivalent, isolated so it can be deleted
outright once `VITE_USE_MOCK_API=false`.

## 8. Prediction logic (mock mode)

```
remaining time = remaining cargo ÷ effective unloading rate
estimated completion = current time + remaining time
expected berth release = estimated completion + post-unload buffer (minutes)
berth conflict = next vessel ETA occurs before expected berth release
```

If the effective rate is zero or missing, the UI never shows a fake ETA —
it shows **"Estimate unavailable — valid unloading rate required."** This
rule is enforced in `computePrediction()` and is covered by the P0
acceptance scenario "Prediction" below.

## 9. Project structure

```
smart-port-frontend/
├── package.json
├── README.md
├── .env.example
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── public/
│   └── assets/
│       ├── vigor-logo.png       (full lockup, used in the report header)
│       └── vigor-emblem.png     (mark only, used in the sidebar/favicon)
└── src/
    ├── api/                     # centralized API client — mock/real switch
    │   ├── client.ts
    │   ├── dashboardApi.ts
    │   ├── vesselApi.ts
    │   ├── readingApi.ts
    │   └── delayApi.ts
    ├── mock/                    # mock data + in-memory service layer
    │   ├── mockData.ts
    │   └── mockServices.ts
    ├── types/index.ts           # VesselVisit, Berth, PredictionData, etc.
    ├── lib/
    │   ├── format.ts            # date/number/unit formatting
    │   └── prediction.ts        # mock-mode calculation (isolated, disposable)
    ├── hooks/useAppData.ts       # data loading + mutation dispatch
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── TopBar.tsx
    │   └── ui/                  # KpiCard, StatusBadge, ProgressBar,
    │                            # BerthRisk, BerthTimeline,
    │                            # OperationalTimeline, DataQualityBadge,
    │                            # ReadingForm, DelayForm, VesselForm,
    │                            # States (Empty/Error/Loading), Feedback
    │                            # (Toast/Modal), Field, Layout (Card,
    │                            # SectionHeader, PageHeader)
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Vessels.tsx
    │   ├── NewVessel.tsx
    │   ├── VesselDetail.tsx
    │   ├── Berths.tsx
    │   ├── DelaysPage.tsx
    │   ├── History.tsx
    │   └── VesselReport.tsx
    ├── App.tsx                  # page routing (state-based, see below)
    ├── main.tsx
    └── index.css
```

## 10. Routing

The app uses simple in-memory state (`useState<Page>`) rather than
`react-router-dom`, to keep the dependency list minimal for a
beginner-friendly setup. The logical route map is:

| Page key         | Equivalent route              |
|-------------------|-------------------------------|
| `dashboard`       | `/dashboard`                  |
| `vessels`         | `/vessels`                    |
| `vessel-new`       | `/vessels/new`                |
| `vessel-detail`    | `/vessels/:id`                |
| `berths`          | `/berths`                     |
| `delays`          | (vessel-scoped, via detail)   |
| `history`         | `/history`                    |
| `report`          | `/reports/:id`                |

If deep-linking becomes a requirement later, swap `App.tsx`'s state for
`react-router-dom` — every page component already receives its data as
props and doesn't know how navigation is implemented.

## 11. Demo workflow (5–8 minutes)

1. **Dashboard** — see MV Ocean Star actively unloading at Berth B02, 70%+
   progress, and a **potential berth conflict** against MV Blue Horizon.
2. **Vessels** — search/filter the list; open MV Ocean Star.
3. **Vessel detail** — add a reading (progress/ETA update live), record a
   delay (appears in the timeline), then complete the visit.
4. **Berths** — see B02 clear, B01 occupied by a low-risk vessel.
5. **History → Vessel report** — open MV Coastal Pearl's completed report
   and try Print / Export.
6. **New vessel visit** — create one from scratch; it appears in the list
   immediately.

## 12. Known MVP limitations

- All data is in-memory and resets on page reload — there is no
  persistence layer yet (that's the FastAPI + PostgreSQL backend, not yet
  built).
- Delay categories, demo vessel names, and all cargo figures are
  **illustrative only** — they are not real Vigor Cement Works operational
  facts.
- No authentication or user management (a single demo operator profile is
  shown in the header).
- No live PLC/SCADA/ERP integration, no machine learning, no automatic
  machinery control — out of scope for this MVP by design.
- Routing is state-based, not URL-based (see "Routing" above) — refreshing
  the browser returns you to the dashboard.

## 13. Acceptance scenarios covered

- **P0 — Create vessel visit**: `New vessel visit` form, no database
  editing required.
- **P0 — Add reading**: updates progress / rate / remaining / ETA live.
- **P0 — Prediction**: a valid rate produces an estimate; a zero/missing
  rate shows "Estimate unavailable" rather than a misleading time.
- **P0 — Berth conflict**: MV Ocean Star → MV Blue Horizon demonstrates
  this by default on load.
- **P0 — Delay**: recorded delays appear in the vessel's timeline and
  summary.
- **P0 — History**: MV Coastal Pearl demonstrates a completed visit with a
  printable report.
- **P1 — Validation**: forms show inline errors and preserve entered
  values on failed submission.
- **P1 — Responsive**: sidebar collapses to a slide-over on mobile/tablet;
  tables scroll horizontally at narrow widths.
