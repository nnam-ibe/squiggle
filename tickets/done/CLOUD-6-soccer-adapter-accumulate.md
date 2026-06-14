# CLOUD-6: Soccer adapter — accumulate stats

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Implement `accumulate()` for soccer: played/W/D/L, GF/GA/GD, points
(from league config), and retained head-to-head sub-results.

## Acceptance Criteria
- [x] Unit tests assert correct aggregates for a small fixture
- [x] Points use the league's `pointsForWin/Draw/Loss`

## Notes
Completed in commit 3d85920 in `src/domain/sports/soccer.ts`. `accumulate` also
supports an `onlyEntities` filter used to build head-to-head mini-tables. Includes
`parseRow` (overlaps with CLOUD-10) and the H2H criteria used by the resolver.
