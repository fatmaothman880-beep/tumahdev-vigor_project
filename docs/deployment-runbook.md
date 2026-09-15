# Native deployment runbook

1. Install Node.js, Python, and PostgreSQL; install dependencies using README.md.
2. Configure the ignored `.env` with the database URL, signing secret, and API settings. Alternatively run `scripts/local_database.py setup` for a separate project-local development database.
3. Back up existing PostgreSQL data and `data/auth.json` before upgrades.
4. Run `scripts/start-environment.ps1`. It applies migrations and launches both application services. Use `-Seed` only when demonstration records are wanted.
5. Run `scripts/smoke-test.ps1`, backend tests, and the UAT checklist.
6. Record the accepted commit and test evidence before deployment acceptance.

The development launcher binds the application to loopback. For shared hosting, configure a service manager, HTTPS, and firewall settings appropriate to the host. Keep the operational FastAPI service and PostgreSQL private; browser requests must pass through the authenticated Node gateway. The included launcher is a local development helper, not a production service manager.

Run `npm run build` then `npm start` to serve the compiled Node/frontend application. Run FastAPI separately. The two services need the same `.env` database configuration and a reachable PostgreSQL instance.

`stop-environment.ps1` stops the recorded application processes but leaves PostgreSQL running. `backup-database.ps1` creates a native pg_dump archive. Restore-test backups into a separate database before relying on them.
