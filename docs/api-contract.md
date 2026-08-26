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

### Prediction

`generated_at`, optional `target_time`, `method`, `inputs`, `data_quality`

`target_time` must be absent when the effective rate is zero, missing or otherwise invalid. `data_quality` must explain missing, stale or provisional input.

### ActiveDashboard

The aggregate response must include the active vessel and visit, progress percentage, remaining cargo, effective rate, prediction, expected berth release, next-vessel ETA and conflict status. Exact nesting remains a team sign-off item.

## Open sign-off decisions

- Identifier type: UUID or integer serialized as a string.
- Allowed visit status values and transition rules.
- Reading precedence when both unloaded and remaining quantities are supplied.
- Data-quality enum values and stale-reading threshold.
- Active-dashboard JSON nesting.
- Authentication approach for demo write operations.
