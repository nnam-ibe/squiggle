# CLOUD-12: POST /api/datasets/validate (preview, no save)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Route returns `{errors, warnings, previewTable, roundsPresent}` by
parsing, validating, and computing standings — persisting nothing.

## Acceptance Criteria
- [x] Returns a computed final table + warnings for a valid file
- [x] Returns errors with 4xx for invalid

## Notes
- `src/upload/preview.ts` — `previewSoccerUpload()` runs `validateSoccerUpload`
  (CLOUD-11) and, when valid, computes the final-round standings table via
  `computeStandings` (CLOUD-8). Returns the validation outcome plus `previewTable`
  (position, team, points, P/W/D/L, GF/GA/GD). Pure/testable; persists nothing.
- `src/app/api/datasets/validate/route.ts` — Node-runtime `POST` handler: reads
  multipart `{ file, leagueId, season }`, guards file size before reading, calls
  the preview core, returns 200 when valid (warnings allowed) or 400 with
  structured errors. Missing file / unknown league → 400.

7 new tests (3 preview core + 4 HTTP handler built with FormData/File/Request);
58 total. F1 validate route is deferred (validator is soccer-only for now;
non-soccer leagues return a `wrong_sport` error).
