# Defect Log and Triage

Use this log for integration defects that affect the MVP demo path. Environment blockers are recorded separately so they are not confused with product defects.

Feature-freeze note: no product defect can be closed or accepted without execution evidence. Post-freeze code changes require a defect ID and focused regression result.

## Severity

| Severity | Meaning | Release rule |
| --- | --- | --- |
| P0 | Core demo path is unusable, data is corrupted, or a critical security/safety boundary is broken | Must be fixed before release |
| P1 | Core behavior is wrong but a documented workaround exists | Fix before feature freeze where possible |
| P2 | Non-core or cosmetic problem | Schedule after P0/P1 work |

## Product defects

| ID | Severity | Status | Area | Summary | Owner | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| None | - | - | - | No product defects can be confirmed until the integrated API is runnable | - | - |

## Environment blockers

| ID | Status | Summary | Required action |
| --- | --- | --- | --- |
| ENV-001 | Open | Docker CLI is not available to the current shell | Install/start Docker Desktop and reopen the terminal |
| ENV-002 | Open | Windows Store Python cannot launch in the current logon session | Repair/reinstall Python or reopen in a session where `py --version` works |
| ENV-003 | Open | Backend and seeded vessel/berth IDs are not present on this branch | Integrate backend/data branches and provide test IDs |
| ENV-004 | Open | No frontend/backend demo build or approved staging URL exists | Integrate application branches and select an approved demo host |

## Daily triage procedure

1. Run `python -m pytest -m integration --require-api` against the integrated environment.
2. Record each failure with the exact command, response body and affected commit.
3. Assign severity and an owner; contract disagreements are not implementation defects until the contract is signed off.
4. Retest fixes on the member branch and again after merge into `develop`.
5. Do not close an item without reproducible passing evidence.
