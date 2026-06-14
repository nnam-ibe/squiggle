# CLOUD-4: CI pipeline + Vitest harness

**Status:** in-progress  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 0 — GitHub Actions (or equivalent) running typecheck, lint, and Vitest on PRs.

## Acceptance Criteria
- [x] A trivial test runs green in CI (Vitest configured locally; tests run green)
- [ ] Failing test blocks merge (CI workflow not yet created)

## Notes
Vitest harness done (commit 9228663: `vitest.config.ts`, `test` scripts) and 16
tests pass locally. Remaining: add the CI workflow (GitHub Actions) that runs
typecheck + lint + `vitest run` on PRs and blocks merge on failure.
