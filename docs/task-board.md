# MVP 1 Task Board

This lightweight board tracks Member 4 deliverables until a shared issue tracker is configured.

| ID | Deliverable | Priority | Target | Status | Dependency |
| --- | --- | --- | --- | --- | --- |
| T31 | Repo workflow, integration convention and PR rules | P0 | Day 1 | Done on branch; team/repo-setting sign-off pending | None |
| T32 | Repeatable local or Docker environment | P0 | Day 1-2 | Bootstrap and health-check scripts added; Docker execution pending | Docker Desktop and app services |
| T33 | API integration-test scaffold | P0 | Day 2-3 | Scaffold added; execution pending Python and backend `/health` | Backend health endpoint |
| T34 | Core workflow tests | P0 | Day 3-5 | Full test implemented; runtime pass pending | Stable core API and prediction rules |
| T35 | CSV import | P2 | Day 5 | Deferred: core workflow has not passed | Core workflow tests |
| T36 | Management report/export | P1 | Day 5-6 | Contract, workflow assertions and JSON export added; runtime pending | Report API and KPI queries |
| T37 | Security and continuity checklist | P1 | Day 5-6 | Checklist/scripts added; integrated checks and restore test blocked | Environment and deployment decisions |
| T38 | Demo/staging deployment | P0 | Day 6-7 | Runbook/smoke test ready; deployment blocked | Integrated build |
| T39 | UAT and defect triage | P0 | Day 6-7 | Checklist and triage process ready; execution blocked | Testable demo path |
| T40 | Demo script, README and handover | P0 | Day 7-8 | Documentation complete; release/rehearsal blocked | Deployment and UAT evidence |

## Day 1 exit evidence

- Branch roles and integration flow are documented.
- Pull requests have a standard description and readiness checklist.
- Safe environment defaults and secret-exclusion rules exist.
- PostgreSQL can be started independently through Compose.
- The shared API contract has an initial reviewable draft.
- Cross-team agreement and GitHub protection settings remain explicit follow-up actions.

## Day 2 exit evidence

- `scripts/start-environment.ps1` validates Compose, starts PostgreSQL and waits for a healthy container.
- `scripts/stop-environment.ps1` provides the non-destructive default shutdown path.
- `pytest` integration configuration supports local, CI and staging API URLs.
- The health contract test skips when an API is intentionally absent and fails in `--require-api` mode.
- Runtime verification remains blocked on this workstation until Docker and Python are available to the shell and the backend health endpoint is merged.

## Day 3 exit evidence

- The API client reports method, path, expected status and response body on contract failures.
- The prediction workflow creates an active visit and adds two timestamped readings.
- Assertions cover progress, remaining cargo, positive rate, ETA generation timestamp and data quality.
- Seeded vessel/berth IDs and dashboard nesting are documented contract dependencies.
- Runtime execution remains pending Python, a running API and seeded IDs.

## Day 4 exit evidence

- The workflow creates a distinct next vessel on the active berth and expects an explicit conflict flag.
- Delay creation verifies calculated duration, cause/category persistence and list retrieval.
- JSON object/list response shapes fail with readable contract errors.
- `docs/defect-log.md` defines P0-P2 severity, evidence and closure rules.
- Current workstation and integration dependencies are recorded as environment blockers, not unverified product defects.

## Day 5 exit evidence

- A final zero-remaining reading precedes the visit transition to `completed`.
- Completed history must include the exact created visit.
- The management report reconciles visit ID, cargo and the persisted 30-minute delay.
- `scripts/export-vessel-report.ps1` validates and exports the API report as JSON.
- Generated operational reports are excluded from Git.
- CSV import remains deferred because the core workflow has not produced a green runtime result.

## Day 6 exit evidence

- Deployment runbook requires a recorded URL, commit, timestamp and passing smoke/integration results.
- API/frontend smoke checks are automated in `scripts/smoke-test.ps1`.
- Tracked environment files, private keys and high-confidence token patterns are checked automatically.
- Database backup procedure writes only to ignored artifacts by default.
- Security/continuity and UAT checklists use Pass/Fail/Blocked states with evidence requirements.
- Deployment and UAT remain blocked; no application services or approved demo host are available.

## Day 7 exit evidence

- Member 4 feature freeze is declared; stretch work remains excluded.
- The operator demo script covers the active board, reading/ETA, delay, conflict, history/report and explicit scope boundary in 5-8 minutes.
- Release gates prohibit tagging or merging to `main` while required evidence is blocked.
- Handover lists delivered artifacts, required final evidence, known limitations and prioritized backlog.
- Defect closure and demo rehearsal remain blocked until the integrated application is runnable.

## Day 8 exit evidence

- Repository integrity and the tracked-file security audit pass.
- Fresh startup fails because Docker CLI is unavailable.
- API smoke testing fails because no backend is running.
- Python, strict integration tests, backup/restore, UAT and rehearsal remain blocked.
- `docs/final-acceptance.md` records the exact candidate, evidence and release blockers.
- Outcome is `BLOCKED - NOT RELEASED`; no tag or merge to `main` was performed.
