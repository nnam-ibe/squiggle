# CLOUD-22: F1 drivers vs. constructors standings

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 4 — Compute both entity types from the same results (constructors = sum of a
team's drivers). Add F1 `count_back` tie-breaker (most wins, then 2nds, …).

## Acceptance Criteria
- [x] Drivers and constructors standings both correct on a fixture (via `computeStandings`)
- [x] count_back breaks an equal-points tie correctly

## Notes
Added the `count_back` criterion to the F1 adapter (`src/domain/sports/f1.ts`):
it returns each entity's `finishCounts` array as a sort key, which the generic
ranking resolver compares position-by-position (most wins, then 2nds, …). No
changes needed to the engine — drivers vs. constructors is just the `entityType`
passed to `computeStandings`.

4 new tests in `src/domain/sports/f1.test.ts`: a 3-driver fixture where two tie on
points and count-back (2 wins vs 1) decides order, and a constructor fixture
verifying per-team point summing and that drivers aren't listed in constructor
mode. 35 tests total, all green.
