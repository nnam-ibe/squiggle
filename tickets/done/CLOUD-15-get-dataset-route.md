# CLOUD-15: GET /api/datasets/:sport/:league/:season

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — Return raw matches + computed `Standings` for a dataset (404 if none).

## Acceptance Criteria
- [x] Returns standings JSON for a seeded dataset
- [x] 404 for unknown

## Notes
- `src/server/datasets.ts` — `getDatasetStandings({ sport, league, season }, db?)`:
  config-gate first (unknown league / sport mismatch → null, **no DB touched**),
  then load the dataset row + its matches, rebuild `NormalizedResult[]` from the
  jsonb payloads, run `computeStandings` (soccer, team), and return
  `{ sport, league, season, isComplete, roundsPresent, sourceFilename, updatedAt,
  entityType, matches, standings, colors }`. `colors` resolves from the season
  roster (frontend auto-colors anything absent).
- `src/app/api/datasets/[sport]/[league]/[season]/route.ts` — Node GET handler;
  200 with the payload or 404 `{ error: "not_found" }`.

Tests: 2 DB-free (unknown league, sport mismatch → null), 1 route 404 (no DB),
and a gated integration test (seed via commit → fetch: 2 rounds, 4-team final
table, Liverpool color `#C8102E`; plus known-league/no-dataset → null) verified on
ephemeral Postgres. `next build` registers the route. 85 tests (81 pass, 4 DB-skipped).

F1 read (drivers/constructors entity) deferred to CLOUD-23 — soccer datasets only
for now.
