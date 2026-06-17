# CLOUD-25: F1 accuracy + parser tests

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 4 — Seed a recent F1 season and assert final drivers + constructors standings
match official.

## Acceptance Criteria
- [x] Final championship tables match the official result for the seeded season

## Notes
Depends on CLOUD-22. Like CLOUD-9, needs a real season dataset.

Fixtures (fetched from the Ergast/Jolpica API, the FIA results mirror):
- `src/domain/__fixtures__/formula-1-2024.csv` — every 2024 race + sprint result
  (479 rows, 24 rounds, 24 drivers, all 10 constructors; finish position, fastest-lap
  flag, sprint position), in the F1 template shape.
- `src/domain/__fixtures__/formula-1-2024.official.json` — the official final driver
  (pos/points/wins) and constructor (pos/points) standings, used as the oracle.

`src/domain/f1-accuracy.test.ts` runs `computeStandings` over the full season with
the F1 points rules + count-back tie-break and asserts the final **drivers'** and
**constructors'** tables `toEqual` the official FIA standings exactly — including
order, points and wins (Verstappen 437/9W champion; McLaren 666 constructors'
champion; Norris 374, Leclerc 356, Ferrari 652, Red Bull 589 …). A second,
independent inline points computation (documented 2024 rules, no adapter) confirms
the raw fixture reproduces the official driver points, plus invariants (24 rounds /
24 drivers / 10 constructors, contiguous unique positions, points non-increasing,
constructor total == driver total). 5 tests; 92 total pass.

Parser coverage already lives in `src/domain/sports/f1.test.ts` (CLOUD-21/22:
race/sprint/fastest-lap points by era, DNF, count-back, parseRow valid/error cases),
so this ticket adds the missing real-season accuracy oracle.
