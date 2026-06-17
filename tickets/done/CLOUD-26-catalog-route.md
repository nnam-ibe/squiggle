# CLOUD-26: GET /api/catalog

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 5 — Merge league config (sports/leagues) with DB (which `(league,season)`
have data) into the selector data model.

## Acceptance Criteria
- [x] Returns sports → leagues → seasons, marking which seasons have datasets

## Notes
Depends on CLOUD-3, CLOUD-2.

`src/server/catalog.ts` exposes `getCatalog()` (and a pure, DB-free `buildCatalog`
for testing): it reads the distinct `(league_id, season)` pairs that have a dataset
and merges them onto the league config. Output shape (the selector data model used
by the HomeScreen / CLOUD-27):
`{ sports: [{ id, name, icon, leagues: [{ id, name, country?, seasons:
[{ season, status, hasData, href }] }] }] }`. Sports follow a fixed order
(soccer → motorsport); leagues are sorted by name; seasons newest-first.

`GET /api/catalog` (`src/app/api/catalog/route.ts`, nodejs runtime, force-dynamic)
returns it. Verified live: the route lists all 5 soccer leagues + Formula 1 and marks
**only** Premier League 2025-26 (`hasData: true`) — the one seeded dataset. Tests:
4 unit (`buildCatalog` merge / ordering / hasData / F1-no-country) + 1 integration
(`getCatalog` against the live DB, skips in CI). 96 total pass.
