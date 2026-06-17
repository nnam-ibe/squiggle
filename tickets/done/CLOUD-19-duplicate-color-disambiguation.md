# CLOUD-19: Duplicate-color disambiguation

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 3 — When two entities share a color in a season, render the second with a
dashed stroke (per `data/README.md`).

## Acceptance Criteria
- [x] Juventus/Udinese (and Freiburg/Heidenheim) render as solid vs. dashed and remain distinguishable

## Notes
Depends on CLOUD-17. Same mechanism reused for F1 teammates sharing a constructor
color (CLOUD-24).

`buildChartSeries` (`bump-chart-data.ts`) now groups entities by resolved color
(case-insensitive); within any shared-color group the first by name stays solid and
the rest get `dashed: true`. The assignment is results-independent so a team's style
never flips between rounds. Serie A 2024-25 (Juventus & Udinese, both `#000000`) and
Bundesliga 2024-25 (SC Freiburg & Heidenheim, both `#E2001A`) are the live cases.

`BumpChart.tsx` renders a `dashed` row with a dashed stroke (idle and selected), and
swaps its end pill, legend dot, and StatCard badge to an outline-ring/conic cue so
the two same-colored lines stay distinguishable. Unit tests cover the dashed
assignment and case-insensitive comparison; live device check deferred to CLOUD-31
seed data like CLOUD-18.

## Design
Per `chart.jsx`: a `dashed` row renders a **dashed stroke** (`strokeDasharray`
~`lw*2.6 / lw*1.8`), and its end pill / legend dot becomes an **outline ring**
(transparent fill + colored inner border) instead of a solid fill.
