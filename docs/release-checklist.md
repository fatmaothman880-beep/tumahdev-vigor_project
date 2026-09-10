# Feature Freeze and Release Candidate Checklist

Feature freeze is declared by the commit containing this checklist. No stretch feature, including CSV import, may be added unless every P0 demo-path check is already green.

## Candidate identity

| Field | Value |
| --- | --- |
| Candidate commit | `b0e4e331cf2d5a97b699534c93641ed144be70c6` (Member 4 candidate only) |
| Candidate branch | `M4-QA,-Integration,-DevOps-&-Reporting-Lead` |
| Demo URL | Not assigned |
| Feature freeze | Active for Member 4 work |
| Release status | Blocked - not released |

## Required gates

| Gate | Status | Evidence required |
| --- | --- | --- |
| All member branches integrated into `develop` | Blocked | Merge commit/PR references |
| Fresh environment starts from README | Blocked | Command output and timestamp |
| API and frontend smoke checks pass | Blocked | `scripts/smoke-test.ps1` output |
| P0 core workflow integration test passes | Blocked | Strict pytest output |
| UAT checklist passes with no P0 defect | Blocked | Completed `docs/uat-checklist.md` |
| Security/continuity checklist accepted | Blocked | Reviewed checklist and backup/restore evidence |
| Seeded demo scenario is reproducible | Blocked | Seed command and record identifiers |
| Demo rehearsal completes in 5-8 minutes | Blocked | Rehearsal record in `docs/demo-script.md` |
| Limitations and backlog are approved | Prepared | `docs/handover.md` |
| Exact accepted commit is recorded/tagged | Blocked | Commit hash and release tag |

Day 8 evidence is recorded in `docs/final-acceptance.md`. The static tracked-secret check passed, but the full security/continuity gate remains blocked because application and restore checks cannot run.

## Freeze rules

- Accept only P0/P1 fixes required for the demo, setup, security or handover.
- Require a defect ID and test evidence for every post-freeze code change.
- Do not add CSV import, ML, optimization or live industrial integrations.
- Re-run smoke, integration and affected UAT checks after every accepted fix.
- Do not tag or merge to `main` while any required gate is blocked.
