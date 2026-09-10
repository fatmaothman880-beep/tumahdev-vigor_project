# Security and Continuity Checklist

Status values are evidence-based: `Pass`, `Fail`, `Blocked`, or `Not checked`.

| Check | Status | Evidence / required action |
| --- | --- | --- |
| `.env` and generated reports are excluded from Git | Pass | `.gitignore` rules and `scripts/security-check.ps1` |
| No high-confidence token/private-key pattern is tracked | Pass | Day 6 static security script |
| Shared deployment uses non-demo database credentials | Blocked | No deployment environment exists |
| Backend write routes have documented demo authentication | Blocked | Backend not integrated |
| CORS allows only approved demo frontend origins | Blocked | Backend not integrated |
| PostgreSQL is not publicly exposed | Blocked | Staging network not selected; local Compose publishes port 5432 |
| Dependencies have no critical known vulnerability | Blocked | Frontend/backend dependency manifests are absent |
| Health endpoint is reachable after deployment | Blocked | No running API |
| Database backup is generated and restore-tested | Blocked | Docker/database unavailable; backup script prepared |
| Demo data contains no production or personal data | Pass | `sample_data/README.md` policy; no data files tracked |
| No PLC/SCADA write or machinery-control behavior exists | Pass | Current tracked repository contains documentation/tests only |

## Static check

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\security-check.ps1
```

The script is a guardrail, not a complete security review. Authentication, authorization, CORS and dependency checks require the integrated application.

## Database backup

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-database.ps1
```

Backups default to `artifacts/backups/`, which is ignored by Git. Store accepted backups in an approved protected location and test restoration before release. Never commit operational database exports.
