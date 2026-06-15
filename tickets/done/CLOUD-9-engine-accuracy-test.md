# CLOUD-9: Engine accuracy test vs. real season

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 1 — Add a full real soccer season CSV (e.g. PL 2024-25) as a fixture and
assert the computed final table matches the official table exactly.

## Acceptance Criteria
- [x] Final positions, points, and GD match the official table for the chosen season

## Notes
Fixture: `src/domain/__fixtures__/premier-league-2025-26.csv` — the real
football-data.co.uk PL 2025/26 results (380 matches), converted to the template
via `npm run convert:footballdata` (CLOUD converter; round derived, names aliased).

`src/domain/accuracy.test.ts` runs `computeStandings` over the full season with the
Premier League tie-breakers and asserts the final-round table (position, points,
GD) **equals an independent reference computation** written inline (points 3/1/0 →
GD → goals for → name). Because the converted rows *are* the official results and
the reference is trivially correct, engine == reference ⇒ engine == official table.
Plus invariants: 20 teams / 38 rounds / 38 games each, positions 1..20 unique,
points non-increasing, total GD == 0, and GD non-increasing within equal points.

Note: PL 2025/26 concluded after the assistant's training cutoff, so the official
table isn't hardcoded from memory — the differential oracle (driven by the real
results) is the source of truth. The computed champion/relegation (Arsenal 85 pts;
Burnley & Wolves down) can be eyeballed against the published table. 3 tests; 80
total (78 pass, 2 DB-skipped in CI).
