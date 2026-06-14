# CLOUD-11: Validation rules (errors vs. warnings)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Zod + roster checks. Hard errors: unknown sport/league, missing columns,
bad numbers/dates, >2 MB or >5,000 rows. Warnings: unknown team (warn-only),
partial season, duplicate-looking fixtures.

## Acceptance Criteria
- [x] Unit tests for each error category
- [x] Unit tests for each warning category
- [x] Unknown teams warn (don't block)

## Notes
`src/upload/validate.ts` — `validateSoccerUpload({ csv, leagueId, season, byteSize })`
returns `{ ok, errors, warnings, results, rowCount, roundsPresent, isComplete,
unknownEntities }`. `ok` is true iff there are no errors (warnings never block).

- Errors: `unknown_league`, `wrong_sport`, `file_too_large` (>2 MB),
  `too_many_rows` (>5,000), `missing_columns` (header check via the new
  `parse.ts` `fields`), `bad_row` (per-row `{row, field, message}` from the adapter).
- Warnings: `unknown_team` (not in season roster → auto-colored later),
  `no_roster` (season roster absent), `partial_season` (rounds < league's full
  count; sets `isComplete=false`), `duplicate_fixture` (same round+home+away).

Roster/format come from the config loader (CLOUD-3); validation is hybrid /
warn-only on unknown teams per data/README.md. Small enabler: `parseResultsCsv`
now also returns the detected header `fields`.

9 new tests covering every error + warning category (51 total).
