# CLOUD-18: Tap-to-highlight + tooltips

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — Tap/click a line (or label) to bold it and dim others; tap empty space
to reset. Generous touch hit-areas. Tooltip shows round, position, points, W-D-L/GD.

## Acceptance Criteria
- [ ] On a phone-sized viewport, tapping a team isolates its line
- [ ] Tooltip shows correct values
- [ ] Reset works

## Notes
Depends on CLOUD-17. Core to making ~20 lines usable on mobile.

## Design
Match `chart.jsx` `StatCard` + `Legend` (see `DESIGN.md`). Selecting a team bolds
its line (glow) and dims others to a faint grey; tapping the chart **scrubs** a
focus round (dashed guide + enlarged dot). The `StatCard` overlay shows round,
position, points, and W-D-L + GD (soccer) or points/wins/podiums (F1). Legend
chips at the bottom mirror selection; tap a chip or line to toggle.
