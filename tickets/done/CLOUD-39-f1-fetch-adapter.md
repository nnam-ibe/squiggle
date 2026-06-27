# CLOUD-39: Implement F1 fetch adapter (Jolpica → dataset)

**Status:** done  
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
- [x] Fetching F1 2024 via the adapter produces a dataset whose standings match the
      seeded `formula-1-2024.csv` (CLOUD-38 validation reused as the gated live test)
- [x] Constructor rename map centralised; unmapped names fail loudly rather than
      silently diverging
- [x] Requests are throttled; completed seasons aren't re-fetched needlessly
- [x] Source attribution visible in-app
- [x] typecheck / lint / tests pass

## Resolution
- **`src/domain/sources/jolpica-f1.ts`** — `fetchF1Season(year, opts)` paginates
  `/{year}/results/` + `/{year}/sprint/` (limit 100, 300ms throttle, 429 backoff) and
  maps to F1 match rows. Centralised `F1_CONSTRUCTOR_ALIASES`; when a season roster is
  passed as `validConstructors`, any unmapped constructor **throws** (fail-loud).
  Self-contained (no `@` imports) so it runs under both Vitest and `node`.
- **`scripts/fetch-f1.ts`** + `npm run fetch:f1 -- --season <year> [--dry]` — the
  production trigger: fetch a season, validate against the roster in
  `data/leagues/formula-1.json`, and persist as a dataset (idempotent replace,
  mirroring `seed-datasets.ts`). Verified end-to-end: persisted 2024, page renders.
- **`src/domain/sources/jolpica-f1.test.ts`** — offline mapper tests (stub fetch:
  DNF→null, fastest-lap, sprint attach, constructor rename, fail-loud) that always
  run, plus a `skipIf(!JOLPICA_LIVE)` test that fetches live 2024 and matches the
  accuracy fixture row-for-row (479/479). Suite: 99 passed, 7 skipped.
- **Attribution** — "F1 data via Jolpica (Ergast)" shown on motorsport dataset pages.

### Deviations from the original scope (intentional)
- `finish_position` is stored as `number | null` (DNF → `null`), matching the
  persisted F1 `payload` the engine already reads — `"DNF"` is only the CSV form.
  Sprint DNFs are handled the same way (via `positionText`); this was the one fix
  needed to reach an exact 479/479 match.
- Persistence mirrors `seed-datasets.ts` (direct SQL) — there is no shared F1 "commit"
  path; `commitSoccerUpload` is soccer-specific.
- Rename map lives in the source module (exported), not config — central + typed.
- **Out of scope / future:** on-demand or scheduled refresh of the *in-progress*
  season, and a persistent response cache (unneeded for a once-per-season CLI run;
  throttling + idempotent replace cover the rate-limit concern today).

## Notes
Depends on the CLOUD-38 spike. Soccer keeps manual upload; this is F1-only for now.
The spike PoC (`scripts/poc-f1-fetch.ts`) is superseded by the source module + tests.
