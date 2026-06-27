# CLOUD-38: Spike — fetch motorsport (F1) data from an API instead of manual upload

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
Investigate replacing manual CSV upload for motorsport with an automated fetch from
a reliable F1 data API, mapping the response into our internal F1 format.

## Research findings
- **Ergast** (the long-standing free F1 API) was **shut down in early 2025** — do not
  build on it.
- **Jolpica-F1** is the community successor and a **drop-in, Ergast-compatible**
  replacement: `https://api.jolpi.ca/ergast/f1`. Free, no auth, covers 1950–present
  including 2026, and exposes race results, sprint results, and round-by-round
  driver/constructor standings — a clean match for our F1 adapter
  (`round, date, race, driver, constructor, finish_position, fastest_lap, sprint_position`).
  Caveat: volunteer-maintained with rate limits; cache responses and pin a season.
- **OpenF1** (`https://openf1.org`) — free, great for live timing/telemetry, but a
  poorer fit for season standings; keep as secondary option.
- Recommendation: build an **F1 fetch adapter over Jolpica** that produces the same
  shape our existing parser/commit path consumes, so the engine/chart code is reused.

## Acceptance Criteria (spike)
- [x] Decision recorded: chosen API (Jolpica) + endpoints for results/sprints/standings
- [x] Proof-of-concept fetch for one season (2024) mapped to our F1 internal format and
      validated against the seeded dataset — **exact match**
- [x] Follow-up implementation ticket(s) scoped → **CLOUD-39**
- [x] Note licensing/attribution requirements for the chosen source

## Outcome

**Decision: use Jolpica-F1** (`https://api.jolpi.ca/ergast/f1`), Ergast-compatible,
free, no auth. We compute standings ourselves from results via the existing engine,
so we only need two list endpoints (paginated, `?limit=100&offset=N`):
- `…/{season}/results/` — race results (position, driver, constructor, fastest lap)
- `…/{season}/sprint/` — sprint results (sprint finishing position)

**Proven mapping (Jolpica → our F1 row):**
| our field | from |
| --- | --- |
| round / date / race | `Race.round` / `Race.date` / `Race.raceName` |
| driver | `Driver.givenName + " " + Driver.familyName` |
| constructor | `Constructor.name` via a rename map (below) |
| finish_position | `positionText` if numeric, else `"DNF"` |
| fastest_lap | `FastestLap.rank === "1"` |
| sprint_position | sprint result `position` for `(round, driverId)`, else blank |

Constructor rename map (Jolpica → our branding): `Red Bull → Red Bull Racing`,
`RB F1 Team → RB`, `Sauber → Kick Sauber`, `Alpine F1 Team → Alpine`,
`Haas F1 Team → Haas` (others already match).

**Validation:** `scripts/poc-f1-fetch.ts` fetches 2024 and diffs against
`src/domain/__fixtures__/formula-1-2024.csv` (the CLOUD-25/CLOUD-9 accuracy fixture):
rounds 24/24 ✓, rows 479/479 ✓, per-round winners 24/24 ✓, **finish positions
479/479 ✓**, fastest_lap 479/479 ✓, all constructors mapped ✓. The fetched data
reproduces the accuracy-tested season exactly. (Run: `node scripts/poc-f1-fetch.ts`.)

**Licensing / attribution:** Jolpica code is open-source (MIT); the API is free with
**rate limits** (volunteer-funded — burst a few req/s, daily cap), so cache responses,
pin completed seasons, and throttle. Data continues Ergast under non-commercial terms;
**attribute the source in-app** (e.g. "F1 data via Jolpica/Ergast"). For any commercial
use, revisit F1 data licensing. **OpenF1** remains a secondary option for live timing.

## Notes
Reuse the existing F1 normalization in `src/domain` and the commit/persist path.
Out of scope here: building the production sync — this spike picks the source and
proves the mapping. PoC artifact: `scripts/poc-f1-fetch.ts`.
