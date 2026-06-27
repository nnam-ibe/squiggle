# CLOUD-43: Soccer dataset import CLI (batch / prod loads)

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
Importing converted soccer template CSVs only worked one-at-a-time through the
frontend, which doesn't help for loading a batch of seasons or for targeting a
specific database (e.g. production). Add a small import CLI.

## Resolution
- `scripts/import-soccer.ts` + `npm run import:soccer` — takes a Squiggle template CSV
  (`round,date,home_team,away_team,home_goals,away_goals`), persists it as a dataset to
  whatever `DATABASE_URL` points at (use `--env-file=.env.production` for prod). Bulk-
  inserts matches in one statement (per-row round-trips were too slow against the remote
  pooler); idempotent replace per (league, season), like `seed`. Self-contained (no
  `@`-alias imports) so it runs under `node`. `--dry` reports without writing.
- Used it to import all 9 soccer datasets into **production** (`.env.production`):
  La Liga 2024-25 + 2025-26 and Premier League 2011-12 / 2020-21 / 2021-22 / 2022-23 /
  2023-24 / 2024-25 / 2025-26. Verified they render on `squiggle-taupe.vercel.app` with
  brand colors (roster short codes like ELC/OVI/BLB appear, confirming the deployed
  config rosters from CLOUD-41/42).

## Acceptance Criteria
- [x] CLI imports a template CSV to the DB from `DATABASE_URL`
- [x] All 9 La Liga + Premier League datasets live in production and rendering
- [x] typecheck / lint / tests pass

## Notes
`.env` (dev) and `.env.production` are **different** Supabase DBs — earlier imports via
the dev server hit `.env`; this loaded the same datasets into the prod DB.
