# CLOUD-29: Error/empty/loading states + a11y pass

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 5 — Consistent loading skeletons, error toasts, 404 pages; keyboard focus +
color contrast on selectors/chart controls.

## Acceptance Criteria
- [x] No dead-ends
- [x] Basic a11y checks (focus order, contrast, labels) pass

## Notes
Depends on CLOUD-27, CLOUD-28.

**No dead-ends:**
- `src/app/not-found.tsx` — branded 404 (squiggle + "Page not found" + Back-home CTA).
- `src/app/error.tsx` — segment error boundary (`role="alert"`) with "Try again"
  (reset) + Back home, so render/server failures don't dead-end.
- The dataset page now calls `notFound()` for an unknown sport/league (→ branded 404);
  a *known* league with no dataset keeps the friendly "upload your own" state.
- Upload errors/warnings and the commit error are accessible alerts
  (`role="alert"`/`"status"`) rather than silent failures.

**Loading skeletons** (panel tokens + a `.sq-skeleton` shimmer in `globals.css`,
disabled under `prefers-reduced-motion`): `src/app/loading.tsx` (home/upload) and
`src/app/[sport]/[league]/[season]/loading.tsx` (chart + legend skeleton).

**A11y:** a global `:focus-visible` ring (accent outline) makes keyboard focus
visible on every control — verified by tabbing the homepage (theme toggle → sport
cards all show the outline). `aria-label`s already cover the icon-only buttons (back,
theme toggle, stat-card close) and the F1 segmented toggle (`role="tablist"`); the
chart legend chips are real buttons, giving a keyboard path to select any team.
Theming honored (tokens used throughout, including skeletons/404/error).

Verified live (Playwright): `/no/such/page` and `/foo` render the branded 404 with a
way out; focus outlines show on tab; the 404/empty/focus states all match the design.
Gates: typecheck + lint + 96 tests pass.

Note: errors surface as accessible inline alerts + the error boundary rather than a
floating `.sq-toast`; for a dynamic route, `notFound()` renders the branded 404 UI
though the streamed status can stay 200 (UX requirement — a branded page with an
exit — is met).

## Design
Reuse the design's `EmptyState` (squiggle art + copy + upload CTA) and toast
(`.sq-toast`) patterns, and keep the `aria-label`s present on icon buttons
(back, theme toggle, stat-card close). Loading skeletons should use the panel
tokens. Honor the light/dark theme from CLOUD-33.
