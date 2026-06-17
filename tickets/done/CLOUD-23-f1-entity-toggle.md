# CLOUD-23: F1 entity toggle on dataset view

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 4 — `?entity=drivers|constructors` switches the computed standings
server-side; UI toggle.

## Acceptance Criteria
- [x] Toggling re-renders the chart for the selected entity
- [x] Permalink reflects the mode

## Notes
Depends on CLOUD-22, CLOUD-16.

`getDatasetStandings` now reads motorsport datasets (the `// F1 read deferred`
guard is gone): it maps the F1 match payload to `NormalizedResult`, picks
`driver`/`constructor` from `?entity`, and recomputes via `createF1Adapter`. It
returns the active `entity` mode + the league's `entities` list. Drivers aren't in
the config roster, so each driver inherits its constructor's brand color (teammates
then share a color → the chart auto-dashes the second, reusing CLOUD-19; full
per-driver styling is CLOUD-24).

The dataset page reads `searchParams.entity`, renders a `Drivers/Constructors`
segmented control as **links** (`?entity=…`) so each mode is a server-recomputed
permalink, and the subtitle/StatCard switch to F1 wording (round / points-wins-
podiums) via a new `variant` prop on `BumpChart`. `ChartPoint` gained `pod`, and
`buildChartSeries` surfaces F1 wins/podiums when `entityType !== "team"`.

Verified for real against the live DB (a temporary seeded F1 2024 dataset, removed
after): an integration test asserts drivers vs constructors recompute from the same
rows with colors resolving (driver → constructor `#3671C6`, McLaren `#FF8000`), and
Playwright confirmed the toggle navigates to `?entity=constructors`, flips the
active tab, recomputes the chart, and shows the F1 StatCard (wins/podiums). Gates:
typecheck + lint + 86 unit tests pass; the F1 integration test runs locally with
`DATABASE_URL` and skips in CI like the other integration tests.
