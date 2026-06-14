# CLOUD-9: Engine accuracy test vs. real season

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Add a full real soccer season CSV (e.g. PL 2024-25) as a fixture and
assert the computed final table matches the official table exactly.

## Acceptance Criteria
- [ ] Final positions, points, and GD match the official table for the chosen season

## Notes
Depends on CLOUD-8. Blocked on sourcing a real results CSV — needs a decision on
where the dataset comes from (user-provided vs. scraped). Synthetic fixtures
already cover the engine logic; this ticket validates against real-world data.
