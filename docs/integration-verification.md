# Integration verification

Verified on 2026-09-14 in the separate `.integration-target` checkout.

| Check | Result |
| --- | --- |
| TypeScript: `npm run lint` | Passed |
| Production frontend and Node bundle: `npm run build` | Passed |
| Gateway HTTP integration: `npm test` | Passed |
| Production startup, SPA delivery, and seeded login | Passed on a temporary local port; process stopped afterward |
| Backend tests excluding database health | 58 passed, 4 skipped, 1 deselected |
| Docker Compose configuration | Passed |
| Git whitespace check | Passed |

The gateway integration test exercises unauthorized access, wrong passwords, administrator and viewer permissions, registration approval, the removed default-password bypass, disabled sessions, durable account writes, state payload forwarding, stale-revision HTTP 409, query forwarding, removed tracking route, assistant responses, and unavailable-backend HTTP 502.

Backend command used:

```powershell
$env:PYTHONPATH = 'backend'
$env:DATABASE_URL = 'postgresql+psycopg://smart_port:local-test@127.0.0.1:5432/smart_port_test'
.venv\Scripts\python.exe -m pytest backend/tests -q -k 'not test_database_health_endpoint'
```

The database URL above satisfies configuration loading; these checks did not connect to a PostgreSQL server. Four PostgreSQL integration tests skipped because `TEST_DATABASE_URL` was unset. Database health was explicitly deselected. Calculation, buffer, reading validation, operational-state revision/rejection tests, and SQLite-backed site workflow tests passed. The test runner reported two upstream deprecation warnings.

Docker Desktop's engine was not running and no local PostgreSQL server was available. The full Docker stack, PostgreSQL migration execution, PostgreSQL integration tests, external MySQL adapter, and live Gemini enhancement have not been certified in this workspace. Run the documented startup and database tests against a test database before deployment. Offline SQL generation checks the new migration's rendering, not its execution against stored data.

No production deployment or user-acceptance sign-off is claimed. The original vessel-system checkout and its uncommitted handover document were preserved.

The repository secret-pattern checker flagged the literal browser storage key in src/auth/AuthContext.tsx (STORAGE_KEY_TOKEN), which was manually reviewed as a key name, not a credential. Example signing-secret values were removed from the imported setup guide and administration template. No local environment files, auth data, or installed dependencies are staged.
