# CLOUD-10: CSV parse + soccer row normalization

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Parse uploads with Papa Parse; map rows to `NormalizedResult` via the
soccer adapter's `parseRow`; case-insensitive headers; collect structured row errors.

## Acceptance Criteria
- [ ] Valid template parses
- [ ] Malformed rows yield `{field,row,message}` errors

## Notes
Depends on CLOUD-6. The soccer adapter's `parseRow` already exists and handles
case-insensitive headers + structured errors; this ticket adds the Papa Parse
file-parsing layer (CSV string/file → rows) on top.
