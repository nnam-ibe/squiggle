# CLOUD-3: Config loader with Zod validation

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 0 — Load `data/leagues/*.json` at boot, validate each against a Zod schema,
expose typed lookups (`getLeague`, `getSeasonRoster`, `getColor`, `getTieBreakers`,
`getF1PointsRules`). Boot/build fails on malformed config.

## Acceptance Criteria
- [x] All 6 existing configs load
- [x] A deliberately broken config fails validation with a clear error
- [x] Unit tests cover lookups

## Notes
Completed in commit 3d85920. Implemented in `src/config/schema.ts` +
`src/config/leagues.ts`; 9 passing tests in `src/config/leagues.test.ts`.
