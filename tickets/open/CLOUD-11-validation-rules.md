# CLOUD-11: Validation rules (errors vs. warnings)

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Zod + roster checks. Hard errors: unknown sport/league, missing columns,
bad numbers/dates, >2 MB or >5,000 rows. Warnings: unknown team (warn-only),
partial season, duplicate-looking fixtures.

## Acceptance Criteria
- [ ] Unit tests for each error category
- [ ] Unit tests for each warning category
- [ ] Unknown teams warn (don't block)

## Notes
Depends on CLOUD-10, CLOUD-3. Roster lookups via `getSeasonRoster`/`getColor`;
unknown entities get auto-assigned colors per hybrid validation (data/README.md).
