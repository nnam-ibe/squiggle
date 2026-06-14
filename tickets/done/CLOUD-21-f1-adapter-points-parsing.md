# CLOUD-21: F1 adapter — points rules + parsing

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 4 — `parseRow` for the F1 CSV; `accumulate` applying `data/formula-1.json`
points rules: race points by finish, fastest-lap (+1, 2019–2024, top-10 only),
sprint by era. Handle `DNF`/`NC`/blank as no points.

## Acceptance Criteria
- [x] Unit tests for each points-rule era (race table; sprint 2021 vs 2022+; FL 2024 vs 2025)
- [x] Fastest-lap only awarded when eligible (era present + finished top-10)
- [x] DNF scores 0 (entity still appears with 0 points / 0 wins)

## Notes
Implemented in `src/domain/sports/f1.ts` via `createF1Adapter(season, pointsRules)`,
which binds the era-specific race/fastest-lap/sprint blocks for the season. Built
on the existing generic ranking + snapshot engine; exposes the `points` criterion.
`accumulate` also produces `finishCounts` per entity (groundwork for the
`count_back` tie-breaker in CLOUD-22) and supports both `driver` and `constructor`
entity types. 15 tests in `src/domain/sports/f1.test.ts` (all green; 31 total).

Deferred to CLOUD-22: `count_back` criterion + drivers/constructors standings via
`computeStandings`.
