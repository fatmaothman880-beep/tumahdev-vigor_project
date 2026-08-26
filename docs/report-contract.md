# Vessel Management Report

Status: Day 5 proposed contract pending backend/data workstream sign-off.

`GET /reports/vessel/{visit_id}` generates a report from stored system records. The export must not be manually reconstructed.

## Required fields

| Field | Meaning |
| --- | --- |
| `visit_id` | Completed vessel-visit identifier |
| `status` | Visit status; report workflow expects `completed` |
| `vessel` | Vessel identity suitable for management display |
| `berth` | Assigned berth identity |
| `cargo_tons` | Total cargo in metric tons |
| `planned_arrival` | Planned arrival in UTC ISO 8601 format |
| `actual_arrival` | Actual arrival in UTC ISO 8601 format |
| `unload_start` | Unloading start timestamp |
| `unload_end` | Unloading completion timestamp |
| `departure` | Departure timestamp when available |
| `total_delay_minutes` | Sum of persisted delay durations |
| `delay_breakdown` | Delay totals grouped by category/cause |
| `planned_vs_actual_arrival_minutes` | Signed arrival variance |

Optional metrics may be added without breaking consumers. Required fields must not change without updating the API contract, integration test and export documentation.

## Export

Export one report to JSON:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-vessel-report.ps1 -VisitId '<visit-id>'
```

The default output is `artifacts/vessel-report-<visit-id>.json`. Generated reports are ignored by Git because they may contain operational data.

Use `-ApiBaseUrl` for staging or `-OutputPath` for an approved destination. The command validates that the returned report matches the requested visit before writing it.
