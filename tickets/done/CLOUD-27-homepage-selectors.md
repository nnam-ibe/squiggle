# CLOUD-27: Homepage cascading selectors

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 5 — Sport → League → Season selectors; only leagues/seasons with data
selectable; prominent "Upload data" CTA; empty state when no data.

## Acceptance Criteria
- [x] Selecting through to a season navigates to its permalink
- [x] Empty state shows when DB is empty

## Notes
Depends on CLOUD-26.

The homepage (`src/app/page.tsx`) is now a server component that calls `getCatalog()`
(CLOUD-26) and renders `HomeScreen` (`src/components/HomeScreen.tsx`, a client
component). It matches the design `HomeScreen`: brand row + theme toggle, hero, three
numbered `PickStep` groups in the **cascading cards** layout (Sport with icons →
League with country meta → Season with a `no data` meta), a primary CTA, and a
dashed "Upload data" row. Picking a sport resets league→first + season; picking a
league resets the season.

The CTA is a `<Link>` to the season's permalink (`href` from the catalog) and only
appears enabled once a season **with data** is picked; otherwise it's a disabled
"Pick a season to chart". Selecting a season **without** data swaps the CTA for the
`EmptyState` (dashed-squiggle art + Upload CTA). Added an `upload` icon to
`Icon.tsx`; the Upload CTAs link to `/upload` (the CLOUD-28 wizard).

Verified live (Playwright, against the live DB): selecting Premier League → 2025-26
enables the CTA (`/soccer/premier-league/2025-26`) and clicking it loads the chart;
Bundesliga → 2024-25 (no dataset) shows "No chart for Bundesliga · 2024-25 yet". No
component-test infra exists (vitest is node-env, no jsdom/testing-library), so the
interactive behaviour is covered by the live browser check; the catalog model it
consumes is unit-tested in CLOUD-26. Gates: typecheck + lint + 96 tests pass.

## Design
Match `HomeScreen` in `design/project/Squiggle/screens.jsx` (see `DESIGN.md`):
brand row + theme toggle, hero ("Chart the climb."), three numbered `PickStep`
groups (Sport → League → Season) in the **cascading cards** layout, a primary
CTA ("Open {league} · {season}", disabled until a season with data is picked),
and a dashed "Upload data" row. Seasons without data show a `no data` meta and
route to the `EmptyState`.
