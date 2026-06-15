# CLOUD-27: Homepage cascading selectors

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 5 — Sport → League → Season selectors; only leagues/seasons with data
selectable; prominent "Upload data" CTA; empty state when no data.

## Acceptance Criteria
- [ ] Selecting through to a season navigates to its permalink
- [ ] Empty state shows when DB is empty

## Notes
Depends on CLOUD-26.

## Design
Match `HomeScreen` in `design/project/Squiggle/screens.jsx` (see `DESIGN.md`):
brand row + theme toggle, hero ("Chart the climb."), three numbered `PickStep`
groups (Sport → League → Season) in the **cascading cards** layout, a primary
CTA ("Open {league} · {season}", disabled until a season with data is picked),
and a dashed "Upload data" row. Seasons without data show a `no data` meta and
route to the `EmptyState`.
