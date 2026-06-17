# CLOUD-18: Tap-to-highlight + tooltips

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 3 — Tap/click a line (or label) to bold it and dim others; tap empty space
to reset. Generous touch hit-areas. Tooltip shows round, position, points, W-D-L/GD.

## Acceptance Criteria
- [x] On a phone-sized viewport, tapping a team isolates its line
- [x] Tooltip shows correct values
- [x] Reset works

## Notes
Depends on CLOUD-17. Core to making ~20 lines usable on mobile.

Implemented in `BumpChart.tsx`: selecting (line / end-pill / legend chip) glows
the chosen team and dims the rest to `--bump-dim`; tapping the plot scrubs a focus
round (dashed guide + enlarged dot); the `StatCard` overlay shows matchweek,
position, points, played, GD and the W-D-L breakdown. Per-round stats (pts/w/d/l/gd)
are now surfaced through `ChartPoint` in `bump-chart-data.ts`. Reset is via the card
close button or toggling the selected line/pill/chip off.

Reconciliation: the design makes the chart background a **scrub** surface while a
team is selected (not a tap-to-reset target as the description's shorthand implied),
so reset lives on the explicit toggle/close affordances. Live visual check on a real
device is deferred until seed data exists (CLOUD-31); verified via typecheck, lint
and unit tests.

## Design
Match `chart.jsx` `StatCard` + `Legend` (see `DESIGN.md`). Selecting a team bolds
its line (glow) and dims others to a faint grey; tapping the chart **scrubs** a
focus round (dashed guide + enlarged dot). The `StatCard` overlay shows round,
position, points, and W-D-L + GD (soccer) or points/wins/podiums (F1). Legend
chips at the bottom mirror selection; tap a chip or line to toggle.
