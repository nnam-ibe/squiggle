# CLOUD-7: Config-driven tie-breaker resolver

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Implement `ranking.ts` grouping algorithm. Support criteria: `points`,
`goal_difference`, `goals_scored`, `away_goals_scored`, `head_to_head_points`,
`head_to_head_goal_difference`, `head_to_head_away_goals`, `playoff` (skip),
`alphabetical`. H2H operates on the tied group's mini-table and falls through when
members haven't all played each other equally.

## Acceptance Criteria
- [x] La Liga/Serie A H2H-before-GD covered
- [x] Bundesliga/Ligue 1 H2H-after-GD covered
- [x] 3-team mini-table covered
- [x] Unequal-meetings fall-through covered
- [x] `playoff` skip → always total-ordered output

## Notes
Completed in commit 3d85920 in `src/domain/ranking.ts`. `count_back` (F1) is also
in the supported vocabulary but its evaluator ships with the F1 adapter (CLOUD-22).
Tests in `src/domain/standings.test.ts`.
