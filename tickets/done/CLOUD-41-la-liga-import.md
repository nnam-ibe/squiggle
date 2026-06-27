# CLOUD-41: La Liga datahub import — aliases + 2025-26 roster

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
Import La Liga 2024-25 and 2025-26 from datahub/football-data CSVs with correct brand
colors. The converter only ships Premier League team aliases, so La Liga's football-data
abbreviations (`Ath Bilbao`, `Betis`, `Sociedad`, …) don't resolve to the roster, and
there's no 2025-26 La Liga roster in config at all.

## Scope
- `src/upload/footballdata.ts` — add `DEFAULT_LALIGA_ALIASES` and an
  `ALIASES_BY_LEAGUE` lookup; map football-data names → canonical roster names.
- `scripts/convert-footballdata.ts` — pick the alias map by `--league` instead of
  hardcoding the PL map.
- `data/leagues/la-liga.json` — add the 2025-26 roster (2024-25 minus Las Palmas /
  Leganes / Valladolid, plus Elche, Levante, Real Oviedo) with shorts + colors.
- Re-convert both seasons; confirm all team names resolve; import into the DB via the
  app's upload path.

## Acceptance Criteria
- [x] Converting either La Liga season reports "all team names resolve"
- [x] La Liga 2024-25 and 2025-26 datasets exist and render with brand colors
- [x] typecheck / lint / tests pass

## Resolution
- `src/upload/footballdata.ts` — added `DEFAULT_LALIGA_ALIASES` (8 mappings) and
  `ALIASES_BY_LEAGUE`; `footballdata.test.ts` covers the La Liga + PL maps.
- `scripts/convert-footballdata.ts` — picks the alias map by `--league`.
- `data/leagues/la-liga.json` — added the 2025-26 roster (dropped Las Palmas/Leganes/
  Valladolid; added Elche `ELC`, Levante `LEV`, Real Oviedo `OVI`).
- Re-converted both seasons → "all team names resolve" ✓, then imported via the app's
  upload API. Both persisted with **0 warnings** (every team matched the roster):
  `/soccer/la-liga/2024-25` and `/soccer/la-liga/2025-26`, 38 rounds each. Verified the
  pages render (2025-26 shows promoted Elche/Levante/Real Oviedo with brand colors).

## Notes
Aliases: Ath Bilbao→Athletic Club, Ath Madrid→Atletico Madrid, Betis→Real Betis,
Celta→Celta Vigo, Espanol→Espanyol, Sociedad→Real Sociedad, Vallecano→Rayo Vallecano,
Oviedo→Real Oviedo (Elche/Levante already match).
