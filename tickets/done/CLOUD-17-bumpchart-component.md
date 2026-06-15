# CLOUD-17: BumpChart component (static interactive)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — visx SVG: inverted Y (1 at top), round X-axis, one step-line per entity
colored from config, right-edge labels with final position.

## Acceptance Criteria
- [x] Renders a 20-team season resembling the reference image
- [x] Lines use config colors
- [x] Final-position labels align at the right edge

## Notes
`src/components/BumpChart.tsx` — client component porting `design/project/Squiggle/chart.jsx`:
pinned `POS` y-gutter (Y inverted, 1 at top), round x-axis with major ticks,
horizontal gridlines, one **smooth (Catmull-Rom)** line per entity at 2.6px in the
config brand color, and **end pills** (short code + final position) at the right
edge. Responsive width via ResizeObserver (default 360 for SSR), horizontal scroll.

`src/components/bump-chart-data.ts` — pure `buildChartSeries()` pivots
`standings.rounds` into per-entity position histories, resolves color/short from
config with deterministic fallbacks (`autoColor`, abbreviation), sorted by final
position. `getDatasetStandings` now also returns `shorts`. Page swaps the
placeholder table for `<BumpChart>`.

Verified: `next build` ok; served with DATABASE_URL, `/soccer/premier-league/2025-26`
renders `<svg>` with 20 line paths, the `POS` gutter, and pills (ARS, MCI). 2 new
tests (series builder); 83 total.

## Design

Matches `design/project/Squiggle/chart.jsx`. Deferred to sibling tickets:
selection highlight + StatCard + legend + scrub (**CLOUD-18**), dashed-line for
shared colors — note PL 2025/26 has Bournemouth & Man United both on `#DA291C`
(**CLOUD-19**), and the mobile pass (**CLOUD-20**).
