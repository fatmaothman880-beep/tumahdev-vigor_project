# MVP 1 User Acceptance Test

Execution status: Blocked. The checklist is ready, but no integrated application or demo environment is available.

| ID | Acceptance scenario | Expected result | Status | Evidence / defect |
| --- | --- | --- | --- | --- |
| UAT-01 | Create a vessel visit without database editing | Visit persists and returns an ID | Blocked | Backend/database unavailable |
| UAT-02 | Add two unloading readings | Progress, remaining cargo and rate update | Blocked | Backend/database unavailable |
| UAT-03 | View a valid prediction | ETA, generated timestamp, method and quality are visible | Blocked | Backend/prediction unavailable |
| UAT-04 | Submit zero or missing rate data | No misleading ETA is shown | Blocked | Backend/prediction unavailable |
| UAT-05 | Use a stale reading | Data-quality state clearly identifies staleness | Blocked | Backend/prediction unavailable |
| UAT-06 | Schedule the next vessel before berth release | Conflict/risk is visible | Blocked | Integrated dashboard unavailable |
| UAT-07 | Record an equipment delay | Duration and cause persist and appear in report | Blocked | Backend/report unavailable |
| UAT-08 | Submit negative cargo/rate | Input is rejected with a readable message | Blocked | Backend validation unavailable |
| UAT-09 | Complete the active visit | Visit appears in completed history and report | Blocked | Integrated workflow unavailable |
| UAT-10 | Export a vessel report | Export matches stored visit and delay records | Blocked | Report endpoint unavailable |
| UAT-11 | Complete the demo as an operator | No code or database intervention is needed | Blocked | Frontend unavailable |
| UAT-12 | Start from the README on a fresh setup | Seeded system starts and health check passes | Blocked | Docker/app services unavailable |

## Execution rules

- Record the tested commit, environment URL, tester and UTC timestamp.
- Attach command output or screenshots for every pass/fail decision.
- Create a defect-log entry for each failure and assign P0-P2 severity.
- No P0 defect may remain open in the demo path.
- A blocked item is not a pass.
