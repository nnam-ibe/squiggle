# CLOUD-10: CSV parse + soccer row normalization

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Parse uploads with Papa Parse; map rows to `NormalizedResult` via the
soccer adapter's `parseRow`; case-insensitive headers; collect structured row errors.

## Acceptance Criteria
- [x] Valid template parses (bundled soccer template → 4 results, 0 errors)
- [x] Malformed rows yield `{field, row, message}` errors

## Notes
`src/upload/parse.ts` — `parseResultsCsv(csv, adapter)` runs Papa Parse
(header row, trims headers, greedily skips blank lines), surfaces Papa's
structural errors, then maps each data row through the adapter's `parseRow`.
Returns `{ results, errors, rowCount }`; row numbers are 1-based excluding the
header. Sport-agnostic (takes any `SportAdapter`) — F1 reuses it as-is.

Bug fixed along the way: date validation was a format-only regex, so impossible
dates like `2025-13-40` / `2025-02-30` slipped through. Added
`src/domain/date.ts` `isValidIsoDate()` (format + real-calendar check) and wired
both the soccer and F1 adapters to it.

7 new tests (parse: template, case-insensitive headers, structured errors with
correct row/field, blank-line skipping; date: valid/format/impossible). 42 total.
