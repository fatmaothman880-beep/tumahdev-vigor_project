# MVP 1 API Contract

Status: Day 1 draft pending frontend, backend and data workstream sign-off.

## Conventions

- Base URL: `http://localhost:8000`
- Content type: `application/json`
- Timestamps: UTC ISO 8601 strings, for example `2026-08-24T09:30:00Z`
- Quantities: metric tons (`tons`)
- Rates: metric tons per hour (`tph`)
- Identifiers: stable server-generated IDs represented as strings
- Errors: a 4xx status with a readable `detail` field for invalid input

Values must never be inferred as valid when required rate or timestamp data is missing. Demo thresholds and post-unloading duration must remain configurable.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health; returns `{"status":"ok"}` |
| `GET`, `POST` | `/vessel-visits` | List or create vessel visits |
| `GET`, `PATCH` | `/vessel-visits/{id}` | Read or update one visit |
| `GET`, `POST` | `/vessel-visits/{id}/readings` | List or add unloading readings |
| `GET`, `POST` | `/vessel-visits/{id}/delays` | List or add delay events |
| `GET` | `/dashboard/active` | Active visit, prediction and berth-risk view |
| `GET` | `/vessel-visits?status=completed` | Completed visit history |
| `GET` | `/reports/vessel/{visit_id}` | Management summary for one visit |

Completed-history responses are JSON arrays. The vessel report follows `docs/report-contract.md` and is generated from persisted visit, reading and delay records.

## Minimum entities

### Vessel

`id`, `name`, optional `imo_reference`, optional `capacity_tons`, optional `agent`

### VesselVisit

`id`, `vessel_id`, `planned_arrival`, optional `actual_arrival`, `berth_id`, `cargo_tons`, optional `unload_start`, optional `unload_end`, optional `departure`, `status`

### OperationalReading

`id`, `visit_id`, `timestamp`, `source`, optional `unloaded_tons`, optional `remaining_tons`, optional `observed_rate_tph`

At least one cargo quantity must be present. Negative cargo or rate values are invalid.

### DelayEvent

`id`, `visit_id`, `start`, optional `end`, `category`, `cause`, optional `equipment`, optional `responsible_area`

An end time must not precede its start time.

Create responses return HTTP 201 and include `duration_minutes` when both timestamps are present. Delay list responses are JSON arrays ordered by start time.

### Prediction

`generated_at`, optional `target_time`, `method`, `inputs`, `data_quality`

`target_time` must be absent when the effective rate is zero, missing or otherwise invalid. `data_quality` must explain missing, stale or provisional input.

### ActiveDashboard

The Day 3 integration test proposes these top-level fields: `visit`, `progress_percent`, `remaining_tons`, `effective_rate_tph`, `prediction`, `expected_berth_release`, `next_vessel_eta`, and `berth_conflict`.

`prediction` must contain `generated_at`, optional `target_time`, `method`, `inputs`, and `data_quality`. This nesting remains a team sign-off item; update the contract and test together if the team selects another shape.

## Open sign-off decisions

- Identifier type: UUID or integer serialized as a string.
- Allowed visit status values and transition rules.
- Reading precedence when both unloaded and remaining quantities are supplied.
- Data-quality enum values and stale-reading threshold.
- Active-dashboard JSON nesting.
- Authentication approach for demo write operations.
- Seeded vessel and berth IDs used by environment-independent integration tests.
- Collection response shape and ordering for readings and delays.
- Vessel-report fields and metric ownership.
