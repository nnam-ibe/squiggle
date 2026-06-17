# CLOUD-20: Mobile responsiveness pass

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 3 — Legible from ~320px; horizontal scroll for many rounds; touch targets
sized for fingers.

## Acceptance Criteria
- [x] Manual check on 320/375/414px widths
- [x] No overflow/clipping
- [x] Tap-highlight usable

## Notes
Depends on CLOUD-18.

Verification pass — no code changes needed. The chart was built mobile-first in
CLOUD-17/18 (horizontal `.sq-scroll` with the `POS` axis pinned, `ROW_H`/`COL_W`
shrink when N>12, legend chips in a horizontal scroller, StatCard capped at
`max-w-[calc(100%-56px)]`), and it already meets the bar.

Checked against the live Premier League 2025-26 dataset (20 teams × 38 rounds) by
driving the dev server with Playwright (mobile emulation, touch) at each width:

| Viewport | Page hscroll overflow | Tap-highlight → StatCard |
|---|---|---|
| 320px | none (docW == winW) | works |
| 375px | none | works |
| 414px | none | works |

Screenshots confirmed: POS axis stays pinned, the 38 rounds scroll horizontally
inside the frame, dashed-color disambiguation (CLOUD-19) is visible, legend chips
scroll, and tapping a chip/line isolates the line and shows a correct StatCard
(e.g. Aston Villa MW38: P4, 65 pts, 19-8-11 = 38 played, GD +7). Touch affordances
match the design: 16px-wide invisible hit-paths over each line, ~32px legend chips,
22px end pills. Cross-device hardware smoke test remains tracked separately
(CLOUD-32).

## Design
The design is already mobile-first (`Squiggle.html`): chart in a horizontal
`.sq-scroll` with the `POS` axis pinned, legend chips in a horizontal scroller,
single breakpoint at `min-width:720px`. Match its touch targets and column
sizing (`ROW_H`/`COL_W` shrink when N>12).
