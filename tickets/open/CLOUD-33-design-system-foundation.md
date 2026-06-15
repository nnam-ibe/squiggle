# CLOUD-33: Design system foundation (tokens, fonts, dark/light theme)

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 (foundation) — Port the design's token system from `design/project/Squiggle.html`
so all UI tickets share it: CSS variables for colors (dark + light), the amber
accent (`#ffb020`), fonts (Archivo + Spline Sans Mono), radius/shadow scale, and a
dark/light **theme toggle** (`data-theme` on `<html>`). Wire into Tailwind theme.

## Acceptance Criteria
- [ ] Color/spacing/radius tokens available as CSS variables + Tailwind theme
- [ ] Archivo + Spline Sans Mono loaded; headings/body/mono mapped
- [ ] Dark default with a working light variant; theme toggle persists choice
- [ ] Accent is `#ffb020`

## Notes
New ticket from the Claude Design handoff (see `DESIGN.md`). Foundation for
CLOUD-16/17/18/27/28/29 — do this first so components consume tokens rather than
hardcoded values. The prototype defines all variables in `Squiggle.html` `:root`
(and `[data-theme="light"]`); reproduce them, don't re-invent.
