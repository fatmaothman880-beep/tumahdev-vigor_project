# Repository Workflow

## Branches

| Purpose | Repository branch |
| --- | --- |
| Accepted release | `main` |
| Daily integration | `develop` |
| Frontend and UX | `M1-Frontend-&-UX-Lead` |
| Backend and API | `M2-Backend-&-API-Lead` |
| Database and prediction | `M3-Database,-Data-Quality-&-Prediction-Lead` |
| QA, integration and DevOps | `M4-QA,-Integration,-DevOps-&-Reporting-Lead` |

The work guides use generic names such as `feature/qa-devops`. The table above records the branch names that actually exist in this GitHub repository.

## Daily workflow

1. Fetch the latest remote state.
2. Update the local `develop` branch from `origin/develop`.
3. Merge or rebase `develop` into the assigned member branch.
4. Make small, focused commits and run relevant checks.
5. Push the member branch and open a pull request into `develop`.
6. Complete the pull-request template and disclose API/schema changes.
7. Merge only when the affected service starts and the current vertical slice remains usable.

Example commands, replacing `<member-branch>` with the assigned branch:

```powershell
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch <member-branch>
git merge develop
```

## Integration rules

- Do not commit directly to `main`.
- Use `develop` as the integration target and test there before release.
- Require at least one teammate review for pull requests where repository settings allow it.
- Notify the team before merging a breaking API or schema change.
- After feature freeze, accept only fixes required for the demo and handover.
- Record the final accepted commit hash and apply a release tag after UAT approval.

## Commit guidance

Use a short imperative subject and keep each commit focused. Examples:

```text
Add PostgreSQL health check
Document vessel visit API contract
Test zero-rate prediction response
```

## Day 1 sign-off

Before parallel implementation, the team must review:

- API routes, JSON fields, units and timestamp format.
- Database entity names and ownership boundaries.
- Frontend wireframe and the active-dashboard payload.
- Local ports and the shared environment-variable names.

Record decisions in `docs/api-contract.md`; do not rely on chat-only agreements.
