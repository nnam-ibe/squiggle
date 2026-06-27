# CLOUD-38: Spike — fetch motorsport (F1) data from an API instead of manual upload

**Status:** open  
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
- [ ] Decision recorded: chosen API (Jolpica) + endpoints for results/sprints/standings
- [ ] Proof-of-concept fetch for one season (e.g. 2024) mapped to our F1 internal
      format and validated against the existing seeded dataset
- [ ] Follow-up implementation ticket(s) scoped: adapter, caching/rate-limit strategy,
      how seasons are triggered/refreshed, and where fetched data is stored
- [ ] Note licensing/attribution requirements for the chosen source

## Notes
Reuse the existing F1 normalization in `src/domain` and the commit/persist path.
Out of scope here: building the production sync — this spike picks the source and
proves the mapping.
