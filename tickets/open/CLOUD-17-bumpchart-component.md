# CLOUD-17: BumpChart component (static interactive)

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — visx SVG: inverted Y (1 at top), round X-axis, one step-line per entity
colored from config, right-edge labels with final position.

## Acceptance Criteria
- [ ] Renders a 20-team season resembling the reference image
- [ ] Lines use config colors
- [ ] Final-position labels align at the right edge

## Notes
Depends on CLOUD-16.

## Design
Match `design/project/Squiggle/chart.jsx` (see `DESIGN.md`). The design hand-rolls
SVG paths, so visx isn't required — port `BumpChart` directly. Key specs:
- **Smooth (Catmull-Rom) lines by default** (not stepped); `stepped` is an option.
  Line weight **2.6px**, rounded caps/joins.
- Pinned **`POS`** y-axis gutter (`AXIS_W` 40), horizontal gridlines, vertical
  round ticks; major ticks at 1, N, and every 5th.
- **End pills** at each line's right edge: short code + final position (`code`
  style). Selected line gets a glow filter and a focus dot.
- Colors come from config; amber accent `#ffb020`, dark theme default.
