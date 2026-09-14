# Full integration

## Sources and preserved behavior

This branch combines `full-integration` at `faf6b8c5d993d02b4a9d22e9dbe8b663276a1ba9` with the local vessel-system frontend and supporting services at `7f2c070`.

The local executive dashboard, corporate branding, login, administration, assistant, fleet details, scheduling, finance, fuel, and reporting are retained. The target branch's entire FastAPI backend, PostgreSQL models, migrations, validation services, predictions, site workflow, seed scripts, and existing tests are retained.

## Request flow

Browser -> Node gateway on port 3000 -> FastAPI on port 8000 -> PostgreSQL.

The Node gateway handles authentication, account administration, audit history, and the grounded assistant. All other `/api/v1` requests are forwarded to FastAPI after authentication and write-role checks. Operational errors, validation responses, and revision conflicts pass through unchanged. An unavailable backend produces HTTP 502 instead of storing operational changes in a second in-memory server.

Normalized port-call records and the wider frontend planning snapshot retain the branch's existing two-model design. The snapshot is stored in `frontend_operational_state` and uses revision checks; it does not replace normalized readings or visit records. Backend-only site workflow routes remain available through the gateway; this integration does not invent new site-specific screens.

## Tracking removal

The tracking page, API wrapper, navigation entry, position types, demo coordinates, position updates, and tracking alerts are removed. The operational schema rejects the old `vesselPositions` field. Migration `d54e0f060004` deletes that key from stored snapshots and advances their revision. The browser also drops the old key when loading cached state. Migration rollback restores only an empty field; deleted coordinates cannot be reconstructed.

## Accounts and deployment

The `auth_data` volume holds locally managed user accounts and the latest 500 audit entries. Optional MySQL account integration remains available through the imported adapter; it is not the operational persistence layer. Back up this volume alongside PostgreSQL. Set a stable `AUTH_SECRET` if sessions should survive restarts.

Demo login accounts and the role switcher remain for evaluation. They must be replaced for a production rollout. Disabled accounts and changed roles are rechecked for each authenticated request. The imported default-password bypass has been removed.

FastAPI is bound to loopback on the host and is intended to sit behind the gateway. The retained `nginx.conf` is an optional reverse-proxy example pointing at the Node gateway, not at FastAPI. Static-only hosting cannot run this complete stack.

## Verification

See `docs/integration-verification.md` for checks run for this merge and environment limitations. Existing historical handover and acceptance documents are retained as history; they are not evidence of current production acceptance.
