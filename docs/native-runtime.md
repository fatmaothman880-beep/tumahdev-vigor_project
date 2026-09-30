# Native runtime

For manual Ubuntu setup and the two-terminal startup commands, see [README](../README.md#start-on-ubuntu). Native processes load `.env`, not `.env.docker`.

## Windows helper scripts

The container definitions and Nginx container configuration have been removed. Startup, stop, and backup scripts now use installed Node.js, Python, and PostgreSQL tools.

The optional project-local database runs on 127.0.0.1:55432 with files under `.local/postgres`. Its credentials are generated into ignored `.env`; the existing system PostgreSQL service is left alone. A separately managed database can be configured instead.

The startup script applies migrations, optionally seeds demo data, starts FastAPI and the Node gateway, and verifies database health through the gateway. Process IDs and start times are recorded under `artifacts` so the stop command cannot accidentally stop a different process that later reused a PID. Logs are also kept under `artifacts`. Backend dotenv loading uses an absolute path to the project `.env`.

Application data remains in PostgreSQL; this change does not substitute demo data for the backend. Account persistence remains at `data/auth.json`.

Earlier acceptance documents describe historical environments. Use README.md and the native deployment runbook for current startup instructions.

## Verification on 2026-09-15

- All database migrations applied successfully to native PostgreSQL 18.
- 63 backend tests passed, including the PostgreSQL integration tests.
- TypeScript validation, gateway HTTP tests, and production build passed.
- PowerShell syntax checks and Python script compilation passed.
- Native startup verified the web page and PostgreSQL health through the gateway.
- Native pg_dump backup restored successfully into an isolated temporary database; restored seed data and migration version were checked, then the temporary database was removed.
- The native stop command released both application ports. Startup reuses the same database without reseeding.

An initial frontend-check attempt exhausted memory while the old demo preview was still running. After stopping that preview and excluding local runtime directories from frontend discovery, the checks passed sequentially. The Python suite reported upstream deprecation warnings and a pytest cache warning, but no test failures.

Credentials, database files, logs, and process state are excluded from Git. The pre-existing `.gitignore` addition for `.local/` was preserved.
