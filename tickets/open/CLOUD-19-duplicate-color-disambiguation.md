# CLOUD-19: Duplicate-color disambiguation

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — When two entities share a color in a season, render the second with a
dashed stroke (per `data/README.md`).

## Acceptance Criteria
- [ ] Juventus/Udinese (and Freiburg/Heidenheim) render as solid vs. dashed and remain distinguishable

## Notes
Depends on CLOUD-17. Same mechanism reused for F1 teammates sharing a constructor
color (CLOUD-24).

## Design
Per `chart.jsx`: a `dashed` row renders a **dashed stroke** (`strokeDasharray`
~`lw*2.6 / lw*1.8`), and its end pill / legend dot becomes an **outline ring**
(transparent fill + colored inner border) instead of a solid fill.
