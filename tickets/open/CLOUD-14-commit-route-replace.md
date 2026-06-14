# CLOUD-14: POST /api/datasets commit + replace-on-reupload

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Re-validate server-side; rate-limit; transaction deletes any existing
`(league,season)` and inserts the new dataset + matches; sets
`is_complete`/`rounds_present`.

## Acceptance Criteria
- [ ] Committing replaces an existing dataset atomically
- [ ] Partial upload sets `is_complete=false`
- [ ] Returns the permalink

## Notes
Depends on CLOUD-12, CLOUD-13.
