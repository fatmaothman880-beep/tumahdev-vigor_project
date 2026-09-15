# Combined local and remote integration

Sources: local native-Windows commit `758b360` and remote `full-integration` commit `d413694` (including the site workflow UI).

## Combined features

- Kept the executive dashboard, corporate login and roles, administration, assistant, payments, fuel, reporting, fleet, berth planning, native PostgreSQL launcher, and native backups.
- Added the remote operational checklist editor/history, overdue task panel, site registry, database vessel-visit entry, manufacturer/works catalogue, and EAT calendar rotation filters.
- Kept future-berth creation, the planned B02 demo record, and the illustrative expansion comparison. Scenario numbers are labelled as assumptions.
- Kept Docker and live vessel-position tracking removed. The remote dependency-install timeout/retry improvement is carried into the native installation instructions.

## Integration fixes

The remote normalization routine previously deleted every berth except B01 and rewrote historical supplier names. The combined version extends the manufacturer catalogue without deleting berths or changing supplier history. Existing catalogue entries and works are retained, and repeated normalization is idempotent.

Checklist resolution verifies database visits instead of assuming every UUID is a visit ID. Legacy frontend vessel identifiers can resolve to a unique database vessel by reference/name. Planning rotation UUIDs cannot silently substitute for visit IDs.

New editing controls follow Admin/Operations permissions, and read-only users can inspect checklist history. API write permissions remain enforced by the gateway.

Without a configured site registry, visit entry offers existing database vessels and berths. With a configured site, it retains the remote dedicated-site flow. No site survey, capacity, or arrival records were invented during this merge. The optional registry can be configured with the existing `backend/app/database/setup_site.py` command after choosing the correct database berth.

## Verification

- TypeScript validation, gateway tests, workflow API tests, and rotation-boundary tests passed.
- New regression tests verify that saved/custom/future berths and supplier history survive recalculation, catalogue updates are idempotent, and planning UUIDs resolve only to verified database visits.
- 64 backend tests passed against native PostgreSQL, including isolated workflow integration tests. Three upstream/cache warnings remain.
- A native database backup was taken before backend verification.

Run instructions and test commands are in README.md. The merge preserves source history from both branches.

The production build passed (Vite reports a bundle-size advisory for the main frontend chunk). The restarted application passed authenticated HTTP checks for PostgreSQL health, site registry, overdue tasks, operational state, vessels, and berths, plus the application page. No browser-driven visual acceptance test was performed.
