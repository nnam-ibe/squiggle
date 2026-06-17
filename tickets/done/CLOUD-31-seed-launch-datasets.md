# CLOUD-31: Seed validated launch datasets

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 6 — Upload a few verified seasons (e.g. PL 2024-25, one F1 season) so the
homepage isn't empty at launch.

## Acceptance Criteria
- [x] At least 2 datasets visible and rendering correctly in production

## Notes
Depends on CLOUD-30, CLOUD-9, CLOUD-25. Also the point at which rosters/colors and
tie-breaker orders should be verified against official sources (data/README.md risk).

`scripts/seed-datasets.ts` (`npm run seed`, or `--dry` to parse-only) seeds the
launch set into whatever `DATABASE_URL` points at. It's self-contained (talks to
Postgres directly, no app imports) and idempotent (replaces each (league, season)).
The fixtures are the **accuracy-tested real seasons** from the engine tests, so the
standings render exactly the official tables:
- **Premier League 2025-26** (soccer, 380 matches / 38 rounds) — CLOUD-9 fixture.
- **Formula 1 2024** (motorsport, 479 rows / 24 rounds) — CLOUD-25 fixture, which
  drives both the Drivers and Constructors views.

Ran against the production Supabase DB — both now present. Verified rendering via the
app (pointed at that prod DB): `/api/catalog` marks both `hasData`; the homepage
offers Soccer → Premier League → 2025-26 and Motorsport → Formula 1 → 2024; the PL
chart shows Arsenal top (the verified 2025-26 result) and the F1 chart shows
Verstappen P1 with **437 pts / 9 wins / 14 podiums** — the official 2024 championship.

Re: the data/README.md risk — the tie-breaker orders and points are validated by the
CLOUD-9 / CLOUD-25 accuracy tests (engine == official). Colors/shorts come from config
and were spot-checked in the rendered charts.

Caveat: the app isn't deployed yet (CLOUD-30), so "in production" here means the
production database; the seeded data will be live on the public URL once CLOUD-30
ships — no re-seed needed (same DB). Gates: typecheck + lint + 96 tests pass.
