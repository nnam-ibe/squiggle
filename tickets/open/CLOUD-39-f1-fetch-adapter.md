# CLOUD-39: Implement F1 fetch adapter (Jolpica → dataset)

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
Implement the production path for fetching an F1 season from the Jolpica API and
turning it into a dataset, replacing manual CSV upload for motorsport. The source,
endpoints, and field mapping are proven in CLOUD-38 (`scripts/poc-f1-fetch.ts`,
validated to an exact match against the 2024 accuracy fixture).

## Scope
- **Fetch adapter** (`src/server/...` or `src/domain/sources/jolpica-f1.ts`): given a
  season, fetch `/{season}/results/` + `/{season}/sprint/` (paginated `limit=100`),
  map to our `NormalizedResult` rows using the CLOUD-38 mapping:
  - driver = `givenName + " " + familyName`; constructor via the rename map
    (`Red Bull → Red Bull Racing`, `RB F1 Team → RB`, `Sauber → Kick Sauber`,
    `Alpine F1 Team → Alpine`, `Haas F1 Team → Haas`);
  - finish_position = `positionText` if numeric else `"DNF"`;
  - fastest_lap = `FastestLap.rank === "1"`; sprint_position from sprint results.
- **Persist** via the existing commit path so it lands as a normal dataset (reuse the
  engine + chart). Keep the rename map in one place (config), easy to extend.
- **Caching / rate-limit:** Jolpica is volunteer-run with rate limits — cache
  responses, throttle requests, and treat completed seasons as immutable (fetch once).
- **Triggering / refresh:** decide how a season gets fetched (admin/CLI action vs
  on-demand), and whether the in-progress season is periodically refreshed.
- **Attribution:** show "F1 data via Jolpica/Ergast" in the UI per the source terms.

## Acceptance Criteria
- [ ] Fetching F1 2024 via the adapter produces a dataset whose standings match the
      seeded `formula-1-2024.csv` (reuse the CLOUD-38 validation as a test)
- [ ] Constructor rename map centralised; unmapped names fail loudly rather than
      silently diverging
- [ ] Requests are cached/throttled; completed seasons aren't re-fetched needlessly
- [ ] Source attribution visible in-app
- [ ] typecheck / lint / tests pass

## Notes
Depends on the CLOUD-38 spike. Mapping reference + a runnable PoC live in
`scripts/poc-f1-fetch.ts`. Soccer keeps manual upload; this is F1-only for now.
