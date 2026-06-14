# CLOUD-5: Domain types

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Define `NormalizedResult`, `EntityStanding`, `RoundSnapshot`,
`Standings`, `SportAdapter`, `RowError` (and supporting `EntityAgg`, `RankContext`,
`CriterionEval`, `SortKey`) in `domain/types.ts`.

## Acceptance Criteria
- [x] Types compile and are imported by the engine modules

## Notes
Completed in commit 3d85920. Note: F1 `constructor` field renamed to
`constructorName` to avoid clashing with `Object.prototype.constructor`.
