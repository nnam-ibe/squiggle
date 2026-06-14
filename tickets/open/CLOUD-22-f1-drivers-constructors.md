# CLOUD-22: F1 drivers vs. constructors standings

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 4 — Compute both entity types from the same results (constructors = sum of a
team's drivers). Add F1 `count_back` tie-breaker (most wins, then 2nds, …).

## Acceptance Criteria
- [ ] Drivers and constructors standings both correct on a fixture
- [ ] count_back breaks an equal-points tie correctly

## Notes
Depends on CLOUD-21, CLOUD-8. `count_back` evaluator plugs into the existing
ranking resolver (returns a finish-count array sort key).
