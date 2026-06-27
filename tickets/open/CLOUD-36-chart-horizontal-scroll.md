# CLOUD-36: Bump chart shouldn't force horizontal scroll on desktop

**Status:** open  
**Priority:** high  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
On a dataset page like `/soccer/premier-league/2025-26`, the chart requires
horizontal scrolling to see the whole graph even though there's empty space on
either side of the page. Root cause is two-fold:
1. The page caps content at `max-w-[1180px]` (CLOUD-35), so the chart's measured
   container width is artificially small.
2. `BumpChart` (`src/components/BumpChart.tsx`) sizes round-columns to fit the
   container but clamps to a minimum (`minCol` = 30/40px via
   `colW = Math.max(minCol, fitCol)`). With ~38 PL rounds, columns hit the min and
   the SVG (`plotW`) overflows the container → horizontal scroll.

Widening the container (CLOUD-35) gives more room so `fitCol >= minCol` and the
chart fits on desktop. This ticket covers verifying that and handling any residual
overflow.

## Approach
- Land CLOUD-35 first (full-width container), then re-check.
- If a residual overflow remains for high-round datasets at common desktop widths,
  adjust the fit logic (e.g. allow `colW` below `minCol` down to a smaller floor on
  wide viewports, or reduce `PILL_W`/padding) so the full season fits.
- Keep intentional horizontal scroll on small screens (mobile) where fitting all
  rounds isn't feasible.

## Acceptance Criteria
- [ ] On desktop (≥1440px), the full Premier League 2025-26 chart (38 rounds) is
      visible without horizontal scrolling
- [ ] F1 datasets (e.g. `/motorsport/formula-1/2024`, 24 rounds) also fit on desktop
- [ ] Mobile still scrolls gracefully; axis stays pinned; no layout regressions
- [ ] No clipping of end pills/labels at the right edge

## Notes
Depends on CLOUD-35. Verify visually at 1280 / 1440 / 1920 widths.
