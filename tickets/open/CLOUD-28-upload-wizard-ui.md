# CLOUD-28: Upload wizard UI

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 5 — 4-step flow: pick sport/league/season → drop CSV → preview (computed
table + warnings/errors) → confirm (with replace warning). Download-template link.

## Acceptance Criteria
- [ ] Full happy path uploads and lands on the permalink
- [ ] Errors block step 3→4
- [ ] Replace warning shows when a dataset exists

## Notes
Depends on CLOUD-12, CLOUD-14.

## Design
The design mocks only the **entry point** (the dashed upload row + a toast), not
the full 4-step wizard. Build the wizard using the design system tokens/components
in `Squiggle.html` (cards, CTA button, chips, panel/line colors, Archivo + Spline
Sans Mono). The preview step should reuse the `BumpChart` + computed-table styling.
