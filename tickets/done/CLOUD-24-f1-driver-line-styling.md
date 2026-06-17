# CLOUD-24: F1 driver line styling

**Status:** done  
**Priority:** low  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 4 — In the drivers chart, teammates share the constructor color,
disambiguated by line style.

## Acceptance Criteria
- [x] Two drivers of the same team render distinguishably with that team's color

## Notes
Depends on CLOUD-19, CLOUD-23.

CLOUD-23 already had drivers inherit their constructor color and reused CLOUD-19 to
dash the second teammate; this ticket makes the disambiguation first-class and
robust. `buildChartSeries` now assigns a `lineStyle` (`solid` → `dashed` → `dotted`,
alternating after) to each member of a shared-color group, so even a 3-driver
constructor (a real mid-season swap, e.g. Williams 2024) stays distinguishable —
binary solid/dashed couldn't. `ChartSeries.dashed` is kept (derived as
`lineStyle !== "solid"`) for the pill/legend/badge outline-ring cue; `BumpChart`
renders the stroke pattern via a `dashArrayFor(style, width)` helper for both the
idle and the selected (glow) line. Soccer color collisions are always pairs, so they
stay solid+dashed (visually unchanged).

Verified for real: a temporary seeded F1 2024 dataset (Williams with Albon /
Colapinto / Sargeant; removed after) rendered the three Williams lines as
solid / dashed / dotted — Playwright confirmed distinct `stroke-dasharray`
(`null`, `6.2 4.4`, `0.01 4.9`) all in Williams blue `#64C4FF`, and the screenshot
shows Red Bull and McLaren teammates split solid/dashed too. Gates: typecheck +
lint + 87 unit tests pass (incl. a new 3-way line-style test).
