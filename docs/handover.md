# MVP 1 Handover

Status: Application integration is complete on `full-integration`; runtime acceptance remains pending. The earlier Member 4-only assessment is retained in `docs/final-acceptance.md` as historical evidence.

## Delivered by Member 4

- Repository workflow and pull-request checklist.
- Safe configuration template and PostgreSQL Compose skeleton.
- Environment start/stop and database-backup commands.
- API health and end-to-end integration-test scaffold.
- Core workflow assertions for visits, readings, ETA, delay, berth conflict, completion, history and report.
- Management-report contract and JSON export command.
- Deployment, smoke-test, security, continuity, UAT and defect-triage procedures.
- Timed demo script and release-candidate gates.

## Required final handover evidence

- Accepted commit hash and release tag.
- Approved demo URL or documented stable local-demo host.
- Passing fresh-setup, smoke, strict integration and UAT output.
- Seed procedure and IDs for the demonstrated vessel, next vessel and berth.
- Database backup location and successful restore-test record.
- Closed/accepted defect log with no open P0 item.
- Named operational and technical owners for the demo environment.

## Known limitations

- The frontend, backend, ORM models, migrations, seed implementation, and Compose services are now present on `full-integration`.
- Docker and Python cannot currently execute in this workspace session.
- API/schema/report proposals require cross-team sign-off and alignment with the implementation.
- No staging environment or approved URL has been created.
- Automated tests and UAT are implemented/prepared but have not run against an integrated system.
- Local Compose publishes PostgreSQL for development; production should keep that port on a private application network.
- CSV import was correctly deferred because the core workflow has not passed.

## Next-phase backlog

| Priority | Item | Exit condition |
| --- | --- | --- |
| P0 | Integrate Members 1-3 into `develop` | Frontend, API and database start together |
| P0 | Resolve API/schema contract decisions | Tests and implementation use one signed-off payload shape |
| P0 | Run and fix the core workflow | Strict integration suite passes with reproducible seed data |
| P0 | Deploy and complete UAT | Stable URL/local demo and no open P0 defect |
| P1 | Add demo authentication and authorization | Write operations are protected and roles documented |
| P1 | Restrict CORS/database network exposure | Only approved origins/services can connect |
| P1 | Execute backup restoration | Demo database can be recovered from documented backup |
| P2 | Add CSV import after green core tests | Malformed rows are rejected through API-equivalent validation |
| Later | Validate site rates, buffers and post-unload assumptions | Operations owners approve units, thresholds and workflow |
| Later | Approved read-only industrial integration | Security/site approval and interface contract exist |
| Later | ML/optimization evaluation | Sufficient clean historical data and baseline evaluation exist |

The MVP must never send start, stop or other control commands to PLC/SCADA or industrial machinery.
