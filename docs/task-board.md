# MVP 1 Task Board

This lightweight board tracks Member 4 deliverables until a shared issue tracker is configured.

| ID | Deliverable | Priority | Target | Status | Dependency |
| --- | --- | --- | --- | --- | --- |
| T31 | Repo workflow, integration convention and PR rules | P0 | Day 1 | Done on branch; team/repo-setting sign-off pending | None |
| T32 | Repeatable local or Docker environment | P0 | Day 1-2 | Environment skeleton added; app services pending | Backend and database shells |
| T33 | API integration-test scaffold | P0 | Day 2-3 | Not started | Backend health endpoint |
| T34 | Core workflow tests | P0 | Day 3-5 | Not started | Stable core API and prediction rules |
| T35 | CSV import | P2 | Day 5 | Blocked until core workflow is green | Core workflow tests |
| T36 | Management report/export | P1 | Day 5-6 | Not started | Report API and KPI queries |
| T37 | Security and continuity checklist | P1 | Day 5-6 | Not started | Environment and deployment decisions |
| T38 | Demo/staging deployment | P0 | Day 6-7 | Not started | Integrated build |
| T39 | UAT and defect triage | P0 | Day 6-7 | Not started | Testable demo path |
| T40 | Demo script, README and handover | P0 | Day 7-8 | Not started | Deployment and UAT evidence |

## Day 1 exit evidence

- Branch roles and integration flow are documented.
- Pull requests have a standard description and readiness checklist.
- Safe environment defaults and secret-exclusion rules exist.
- PostgreSQL can be started independently through Compose.
- The shared API contract has an initial reviewable draft.
- Cross-team agreement and GitHub protection settings remain explicit follow-up actions.
