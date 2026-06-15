# CLOUD-29: Error/empty/loading states + a11y pass

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 5 — Consistent loading skeletons, error toasts, 404 pages; keyboard focus +
color contrast on selectors/chart controls.

## Acceptance Criteria
- [ ] No dead-ends
- [ ] Basic a11y checks (focus order, contrast, labels) pass

## Notes
Depends on CLOUD-27, CLOUD-28.

## Design
Reuse the design's `EmptyState` (squiggle art + copy + upload CTA) and toast
(`.sq-toast`) patterns, and keep the `aria-label`s present on icon buttons
(back, theme toggle, stat-card close). Loading skeletons should use the panel
tokens. Honor the light/dark theme from CLOUD-33.
