# Smart Port Operations — Frontend (MVP-1, v2)

> **Integration update:** the instructions below describe Member 1's original
> mock prototype and are retained as design context. For this integrated build,
> use `README_INTEGRATION.md` in the update package: API mode defaults to false
> for `VITE_USE_MOCK_API`, the API URL includes `/api/v1`, planning is persisted
> in PostgreSQL, and forecasts come from the backend. A tested lockfile is
> included. Prototype endpoint, persistence, and installation statements below
> do not override the integration guide.

A frontend prototype for **Smart Port Operations**, built for **Vigor Cement
Works** (Turky's Group of Companies), Zanzibar.

This is a **semi-manual, presentation-ready operational decision-support
prototype** for monitoring vessel unloading at a cement port: tracking
cargo progress, schedule progress, unloading rate, automatic at-risk/overdue
detection, estimated completion, expected berth release, and potential
berth conflicts with the next scheduled vessel.

> **Scope note:** this is decision support only. It does not send commands
> to any PLC, SCADA system, or unloading machinery, and it does not use
> machine learning. Every forecast is a simple, transparent calculation —
> see "Prediction and risk logic" below.

---

## 1. What's new in this pass

This is an enhancement pass over the original MVP-1 prototype. Everything
that worked before still works; on top of it:

- **Live, continuously updating progress.** A live clock (30s tick) drives
  elapsed/remaining time, forecasts, and alerts without a page refresh —
  see `hooks/useLiveClock.ts`.
- **Cargo progress and schedule (time) progress are shown separately.**
  They are never blended into one number — see `components/ui/DualProgress.tsx`
  and `lib/timeProgress.ts`.
- **Automatic at-risk / overdue detection.** A vessel can be automatically
  flagged **At risk** (forecast has slipped past plan) or **Arrival overdue**
  (expected arrival has passed) with no operator input — see
  `lib/riskEngine.ts`. This is distinct from a **Delayed** status, which
  only appears once an operator confirms an actual delay.
- **Unloading rate unit toggle.** t/h is the default/primary unit
  everywhere; a compact toggle switches display and input to t/min, with
  automatic conversion — see `lib/units.ts` and `components/ui/RateValue.tsx`.
- **Delays & Alerts** replaces the old "Record Delay" concept with three
  clearly separated sections: confirmed delays, automatically predicted
  at-risk vessels, and lightweight operational alerts (arrivals, berth
  availability, rate drops) — see `pages/DelaysPage.tsx` and `lib/alerts.ts`.
- **Editable planned vessels.** A vessel in `Planned`/`Arrived` status can
  be edited (schedule, berth, cargo, status) from its detail page — see
  `pages/EditVessel.tsx`.
- **Period filtering.** Vessels and History can be filtered by Today/This
  week/This month/Last month/This year — see `lib/periods.ts`.
- **Full planned/actual/forecast scheduling fields** with clear date +
  time formatting throughout (registration, expected/actual arrival,
  planned/actual unload start, planned completion, current forecast).
- **Sidebar fixed-height bug fixed.** The sidebar now spans the full
  viewport height and stays in place while the main content scrolls
  independently (`h-screen` + `overflow-y-auto` app shell in `App.tsx`).
- **More prominent, properly matted branding.** The full Vigor lockup now
  sits in a light card at the top of the dark sidebar (so its dark
  wordmark stays legible), with the emblem used compactly elsewhere
  (footer, report header, favicon). Both logo assets have had their white
  background removed for cleaner integration — see `public/assets/`.
- **Cancelled** is now a supported vessel status alongside the original six.

## 2. What this project is

MVP-1 covers the full vessel-visit workflow end to end, running entirely on
**mock data** so it can be demonstrated with no backend running:

1. Register a vessel visit with a full plan (arrival, unload start, completion, rate)
2. Monitor automatic arrival-overdue and completion at-risk detection
3. Enter manual unloading readings (remaining cargo auto-calculated)
4. View cargo progress and schedule progress side by side
5. View expected berth release and compare it against the next vessel's ETA
6. See a berth-conflict warning when one exists
7. Confirm actual delays when they occur
8. Review the operational alerts feed and event timeline
9. Edit a planned vessel's schedule before it arrives
10. Complete a vessel visit
11. View completed/cancelled visits in history, filterable by period
12. Generate a printable vessel summary report

## 3. Technology stack

- **React 18** + **TypeScript**
- **Vite** (dev server / build)
- **Tailwind CSS** for styling
- **lucide-react** for icons
- No state-management library, no router library, no date library — plain
  React state and native `Date`/`Intl` are enough for this MVP (see
  "Routing" below)

## 4. Install

```bash
npm install
```

## 5. Run

```bash
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`). The app
works immediately with **no backend, no database, and no internet access**
required — it starts in mock mode.

## 6. Build

```bash
npm run build
```

Type-checks the project (`tsc -b`) and produces a production build in `dist/`.

## 7. How mock mode works

All data lives in `src/mock/mockData.ts` (seed data, timestamped as offsets
from the moment the app loads — see below) and `src/mock/mockServices.ts`
(an in-memory service layer that mimics the future backend's functions).

`src/api/*.ts` is the layer every page and component actually calls. Each
file checks `VITE_USE_MOCK_API` and either calls the mock service layer
directly, or calls the real FastAPI backend via `src/api/client.ts`'s
`apiFetch()`. No component ever builds a URL or calls `fetch()` directly.

**Why seed timestamps are offsets, not fixed clock times:** automatic
overdue/at-risk detection and the live progress bars compare vessel
timestamps against the real current time continuously. Seed data is
defined as "X minutes from whenever the app loads" so the demo scenarios
(an overdue arrival, a berth conflict, an at-risk forecast) look correct
and keep ticking correctly no matter what time of day you open the app —
see the comment at the top of `src/mock/mockData.ts`.

## 8. Configuring `VITE_API_URL`

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

## 9. How the frontend will connect to the FastAPI backend

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

**Important:** the frontend does not own the prediction or risk
calculations. In real mode, the backend computes progress, rate, ETA,
berth release, berth-risk, and at-risk/overdue status; the frontend only
displays the result. `src/lib/prediction.ts`, `src/lib/riskEngine.ts`,
`src/lib/timeProgress.ts`, and `src/lib/alerts.ts` are lightweight
mock-mode equivalents, each isolated so it can be deleted outright once
`VITE_USE_MOCK_API=false`.

## 10. Prediction and risk logic (mock mode)

```
remaining time         = remaining cargo ÷ effective unloading rate
estimated completion   = current time + remaining time
expected berth release = estimated completion + post-unload buffer (minutes)
berth conflict         = next vessel ETA occurs before expected berth release

schedule (time) progress = elapsed time since unload start ÷ planned operating window

operational risk:
  - "On track"  forecast completion is at or before planned completion
  - "At risk"   forecast completion has slipped past planned completion,
                but no delay has been confirmed by an operator — this is
                never auto-promoted to "Delayed" by how large the slip is
  - "Delayed"   an operator has confirmed an actual delay that is either
                still active or ended within the last 30 minutes
  - "Overdue"   a planned/arrived vessel's expected arrival time has
                passed by more than 20 minutes and it still hasn't arrived
```

If the effective rate is zero or missing, the UI never shows a fake ETA —
it shows **"Estimate unavailable — valid unloading rate required."**

## 11. Unit handling

Unloading rate is always stored internally as **t/h**. The UI defaults to
t/h everywhere and offers a small toggle to switch display/input to
**t/min**, converting automatically (`lib/units.ts`). Planned rate, observed
readings, and displayed rates all respect the same toggle independently
per form/page.

## 12. Project structure

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
│       ├── vigor-logo.png       (full lockup, background removed)
│       └── vigor-emblem.png     (mark only, background removed)
└── src/
    ├── api/                     # centralized API client — mock/real switch
    │   ├── client.ts
    │   ├── dashboardApi.ts
    │   ├── vesselApi.ts         # includes editVesselVisit, cancelVesselVisit
    │   ├── readingApi.ts
    │   └── delayApi.ts
    ├── mock/
    │   ├── mockData.ts          # offset-based seed timestamps (see §7)
    │   └── mockServices.ts      # + editVesselVisit, cancelVesselVisit
    ├── types/index.ts           # + OperationalRisk, OperationalAlert, TimeProgress, RateUnit
    ├── lib/
    │   ├── format.ts            # + fmtFullDateTime, fmtDuration, fmtRelative, toDateTimeLocal
    │   ├── units.ts              # t/h <-> t/min conversion (NEW)
    │   ├── prediction.ts        # cargo progress / ETA / berth release (unchanged logic)
    │   ├── timeProgress.ts      # schedule (time) progress — kept separate from cargo (NEW)
    │   ├── riskEngine.ts        # on-track / at-risk / delayed / overdue (NEW)
    │   ├── alerts.ts            # mock notification generation (NEW)
    │   └── periods.ts           # Today/This week/This month/... filters (NEW)
    ├── hooks/
    │   ├── useAppData.ts        # + editVessel, cancelVessel
    │   ├── useLiveClock.ts      # drives continuous recalculation (NEW)
    │   └── useOperationalModel.ts  # predictions+risks+timeProgress+alerts in one place (NEW)
    ├── components/
    │   ├── Sidebar.tsx          # fixed full-height, matted logo card
    │   ├── TopBar.tsx           # + notification bell
    │   └── ui/
    │       ├── RiskBadge.tsx        (NEW)
    │       ├── DualProgress.tsx     (NEW)
    │       ├── RateValue.tsx        (NEW — unit toggle + display)
    │       ├── Alerts.tsx           (NEW — feed + bell)
    │       ├── BerthRisk.tsx, BerthTimeline.tsx, OperationalTimeline.tsx
    │       ├── ReadingForm.tsx, DelayForm.tsx, VesselForm.tsx (create + edit)
    │       ├── StatusBadge.tsx, DataQualityBadge.tsx, ProgressBar.tsx
    │       ├── States.tsx, Feedback.tsx, Field.tsx, Layout.tsx
    ├── pages/
    │   ├── Dashboard.tsx        # attention feed, active-vessel cards, arrivals, berths
    │   ├── Vessels.tsx          # + period filter
    │   ├── NewVessel.tsx
    │   ├── EditVessel.tsx       (NEW)
    │   ├── VesselDetail.tsx     # central operational record — schedule, dual progress, risk
    │   ├── Berths.tsx
    │   ├── DelaysPage.tsx       # "Delays & Alerts" — confirmed / at-risk / alerts
    │   ├── History.tsx          # + period filter, registration date
    │   └── VesselReport.tsx
    ├── App.tsx                  # live clock, shared operational model, routing
    ├── main.tsx
    └── index.css
```

## 13. Routing

Simple in-memory state (`useState<Page>`), not `react-router-dom`, to keep
the dependency list minimal. Route map:

| Page key       | Equivalent route      |
|----------------|------------------------|
| `dashboard`    | `/dashboard`           |
| `vessels`      | `/vessels`             |
| `vessel-new`   | `/vessels/new`         |
| `vessel-detail`| `/vessels/:id`         |
| `vessel-edit`  | `/vessels/:id/edit`    |
| `berths`       | `/berths`              |
| `delays`       | `/delays`              |
| `history`      | `/history`             |
| `report`       | `/reports/:id`         |

## 14. Demo scenarios (all live-time based)

| Vessel | Status | Demonstrates |
|---|---|---|
| MV Ocean Star (B02) | Unloading | Normal, on-track, actively unloading; a resolved historical delay that no longer affects current status; the berth-conflict pair with Blue Horizon |
| MV Blue Horizon (B02) | Planned | "Arriving soon" alert; the other half of the berth conflict |
| MV Zanzibar Trader (B03) | Unloading | Rate ~30% below plan → automatic **At risk** with a projected delay and a rate-drop alert |
| MV East Wind (B01) | Planned | Expected arrival already passed → automatic **Arrival overdue**, growing live |
| MV Coastal Pearl (B01) | Completed | Full history record, printable report, confirmed historical delay |
| MV Silver Wave (B01) | Cancelled | Demonstrates the Cancelled status in History filtering |

Because seed timestamps are offsets from load time (see §7), leaving the
tab open will cause these forecasts to keep evolving exactly as they
would operationally — e.g. Blue Horizon's "arriving in 35 min" counts down
live, and East Wind's overdue counter grows the longer it's left unattended.

## 15. Known limitations / assumptions

- All data is in-memory and resets on page reload — there is no
  persistence layer yet (that's the FastAPI + PostgreSQL backend).
- Delay categories, demo vessel names, and all cargo/rate figures are
  **illustrative only**.
- No authentication or user management.
- No live PLC/SCADA/ERP integration, no machine learning, no automatic
  machinery control — out of scope for this MVP by design.
- Routing is state-based, not URL-based — refreshing the browser returns
  you to the dashboard.
- `package-lock.json` is intentionally **not** included in this delivery:
  it can only be generated by running `npm install` against the real npm
  registry, which wasn't reachable from the environment this project was
  packaged in. Running `npm install` locally will generate one on first
  install; commit it afterward for reproducible installs.
- The at-risk/overdue thresholds (15 min forecast slip, 20 min arrival
  grace, 30 min delay-recovery grace) are reasonable illustrative
  defaults defined at the top of `lib/riskEngine.ts` — tune them there.
