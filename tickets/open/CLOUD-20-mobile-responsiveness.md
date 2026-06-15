# CLOUD-20: Mobile responsiveness pass

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — Legible from ~320px; horizontal scroll for many rounds; touch targets
sized for fingers.

## Acceptance Criteria
- [ ] Manual check on 320/375/414px widths
- [ ] No overflow/clipping
- [ ] Tap-highlight usable

## Notes
Depends on CLOUD-18.

## Design
The design is already mobile-first (`Squiggle.html`): chart in a horizontal
`.sq-scroll` with the `POS` axis pinned, legend chips in a horizontal scroller,
single breakpoint at `min-width:720px`. Match its touch targets and column
sizing (`ROW_H`/`COL_W` shrink when N>12).
