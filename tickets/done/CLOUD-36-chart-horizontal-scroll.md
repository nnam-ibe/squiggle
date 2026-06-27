# CLOUD-36: Bump chart shouldn't force horizontal scroll on desktop

**Status:** done  
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
- [x] On desktop (≥1440px), the full Premier League 2025-26 chart (38 rounds) is
      visible without horizontal scrolling
- [x] F1 datasets (e.g. `/motorsport/formula-1/2024`, 24 rounds) also fit on desktop
- [x] Mobile still scrolls gracefully; axis stays pinned; no layout regressions
- [x] No clipping of end pills/labels at the right edge

## Notes
Depends on CLOUD-35. Verify visually at 1280 / 1440 / 1920 widths.

## Resolution
Changed the column-width strategy in `src/components/BumpChart.tsx`:

    const colW = fitCol >= FIT_FLOOR ? Math.min(fitCol, MAX_COL) : minCol;
    // FIT_FLOOR = 16, MAX_COL = 72, minCol = 30/40

Instead of `Math.max(minCol, fitCol)` (which clamped columns to a 30/40px minimum
and overflowed dense seasons), the chart now **fills the container** down to a 16px
column floor, only falling back to `minCol` + horizontal scroll on very narrow
(phone) widths. A `MAX_COL` cap stops sparse datasets from stretching absurdly wide.

Behaviour by container width:
- ≥~1250px: fills (unchanged from before, capped at 72px columns).
- ~730–1250px (laptops/desktops — the bug band): now **fits without scroll**
  (previously clamped to 30px and overflowed).
- <~730px (phones): `colW = minCol`, scrolls — **identical to prior behaviour**.

Verified live (dev server, real ~1054px viewport, which is stricter than the 1440
target): PL 2025-26 (38 rounds) and F1 2024 (24 rounds) both fit exactly
(`overflowPx = 0`, svg width == container width) with all end-pills visible. Mobile
fallback is unchanged by construction. typecheck/lint/tests pass.
