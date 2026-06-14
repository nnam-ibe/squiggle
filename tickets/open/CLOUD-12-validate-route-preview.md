# CLOUD-12: POST /api/datasets/validate (preview, no save)

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Route returns `{errors, warnings, previewTable, roundsPresent}` by
parsing, validating, and computing standings — persisting nothing.

## Acceptance Criteria
- [ ] Returns a computed final table + warnings for a valid file
- [ ] Returns errors with 4xx for invalid

## Notes
Depends on CLOUD-11, CLOUD-8.
