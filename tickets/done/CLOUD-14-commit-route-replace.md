# CLOUD-14: POST /api/datasets commit + replace-on-reupload

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — Re-validate server-side; rate-limit; transaction deletes any existing
`(league,season)` and inserts the new dataset + matches; sets
`is_complete`/`rounds_present`.

## Acceptance Criteria
- [x] Committing replaces an existing dataset atomically
- [x] Partial upload sets `is_complete=false`
- [x] Returns the permalink

## Notes
- `src/upload/commit.ts` — `commitSoccerUpload({ csv, leagueId, season, db, ... })`
  re-runs validation (CLOUD-11); on success, in one `db.transaction` deletes any
  existing `(league, season)` dataset (matches cascade) and inserts the new dataset
  + matches (payload jsonb). Sets `rowCount`/`roundsPresent`/`isComplete`, stores
  `uploaderIpHash` (never raw IP). Returns `{ datasetId, permalink, status, ... }`;
  permalink = `/soccer/<league>/<season>`.
- `src/app/api/datasets/route.ts` — Node-runtime `POST`: multipart parse → no-file
  / size guards (DB-free) → per-IP rate limit (CLOUD-13; 429 + Retry-After) →
  `commitSoccerUpload`. 200 success / 400 errors / 429 limited.

Tests: 2 DB-free unit tests prove invalid uploads never touch the DB (exploding
stub db); 2 route early-return tests (no file, non-multipart). DB-gated
integration test verifies persist → replace (old matches cascade-deleted, exactly
one dataset per league+season, new id) + partial `is_complete=false` + permalink —
verified locally against an ephemeral Postgres (and re-ran the rate-limit upsert
test). 71 tests (69 pass, 2 skipped in CI).

**Epic 2 complete.** Upload pipeline: parse → validate → preview → commit/replace,
rate-limited. F1 commit path deferred (validator is soccer-only).
