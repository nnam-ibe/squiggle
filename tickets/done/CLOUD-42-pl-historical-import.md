# CLOUD-42: Import historical Premier League seasons (2011-12, 2020-24)

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
Import seven Premier League seasons from datahub/football-data CSVs with brand colors:
2011-12, 2020-21, 2021-22, 2022-23, 2023-24 (no rosters in config), plus 2024-25 and
2025-26 (already rostered). Follows the same approach as CLOUD-41 (La Liga).

## Resolution
- `src/upload/footballdata.ts` — extended `DEFAULT_PL_ALIASES` with 9 historical-club
  aliases (Blackburn→Blackburn Rovers, QPR→Queens Park Rangers, West Brom→West
  Bromwich Albion, Stoke→Stoke City, Swansea→Swansea City, Norwich→Norwich City,
  Bolton→Bolton Wanderers, Wigan→Wigan Athletic, Luton→Luton Town). `footballdata.test.ts`
  updated.
- `data/leagues/premier-league.json` — added rosters for the 5 historical seasons (20
  teams each), introducing 11 new clubs with shorts + colors (Blackburn Rovers, Bolton
  Wanderers, Luton Town, Norwich City, Queens Park Rangers, Sheffield United, Stoke City,
  Swansea City, Watford, West Bromwich Albion, Wigan Athletic). Existing 2024-25 / 2025-26
  rosters preserved.
- Converted all 7 seasons → "all team names resolve" ✓, imported via the upload API.
  All 7 persisted with **0 warnings**, 38 rounds each. Spot-checked renders: 2011-12
  (Man City champion + Blackburn/Stoke/Wigan), 2023-24 (Luton/Sheffield United) — brand
  colors applied.

## Acceptance Criteria
- [x] All 7 PL seasons convert with "all team names resolve"
- [x] All 7 datasets exist and render with brand colors
- [x] typecheck / lint / tests pass

## Notes
Historical club colors are recognisable brand approximations — tweak hexes in
`premier-league.json` if exact club colors are wanted.
