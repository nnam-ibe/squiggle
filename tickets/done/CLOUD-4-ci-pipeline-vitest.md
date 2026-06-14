# CLOUD-4: CI pipeline + Vitest harness

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 0 — GitHub Actions (or equivalent) running typecheck, lint, and Vitest on PRs.

## Acceptance Criteria
- [x] A trivial test runs green in CI (Vitest configured; 16 tests pass locally)
- [x] CI workflow runs typecheck + lint + tests on every push and PR

## Notes
Vitest harness landed in commit 9228663 (`vitest.config.ts`, `test` scripts).
CI workflow in `.github/workflows/ci.yml` (Node 24, `npm ci`, then
typecheck → lint → test).

History note: the CI workflow was first added on the standings-engine branch but
that commit was left out when PR #1 merged at the ticket-migration commit, so the
file never reached `main`. Restored here on `chore/restore-ci-workflow`.

Caveat: the workflow *runs* the checks, but enforcing "a failing check blocks
merge" additionally requires enabling **branch protection / required status
checks** in GitHub repo settings — a manual admin action, not yet configured.
