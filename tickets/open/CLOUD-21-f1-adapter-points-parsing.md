# CLOUD-21: F1 adapter — points rules + parsing

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 4 — `parseRow` for the F1 CSV; `accumulate` applying `data/formula-1.json`
points rules: race points by finish, fastest-lap (+1, 2019–2024, top-10 only),
sprint by era. Handle `DNF`/`NC`/blank as no points.

## Acceptance Criteria
- [ ] Unit tests for each points-rule era
- [ ] Fastest-lap only awarded when eligible
- [ ] DNF scores 0

## Notes
Depends on CLOUD-5, CLOUD-3. Uses the existing generic ranking + snapshot engine.
