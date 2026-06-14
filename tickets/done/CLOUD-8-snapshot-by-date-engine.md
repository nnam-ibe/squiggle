# CLOUD-8: Snapshot-by-date engine

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Implement `standings.ts`: compute each round's cutoff date, then per
round snapshot all results played on/before the cutoff and rank them.

## Acceptance Criteria
- [x] Postponed match (played after a later round's date) shows in the correct round's snapshot
- [x] Partial seasons stop at the last round with data

## Notes
Completed in commit 3d85920 in `src/domain/standings.ts`. Design refinement: a
round's cutoff is the **median** of its match dates (running max for monotonicity),
not the max — otherwise a single postponed outlier would drag the cutoff forward.
Updated TECHNICAL_DESIGN.md §6.2 accordingly.
