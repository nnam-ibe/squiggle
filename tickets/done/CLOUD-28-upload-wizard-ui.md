# CLOUD-28: Upload wizard UI

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-16  

## Description
Epic 5 — 4-step flow: pick sport/league/season → drop CSV → preview (computed
table + warnings/errors) → confirm (with replace warning). Download-template link.

## Acceptance Criteria
- [x] Full happy path uploads and lands on the permalink
- [x] Errors block step 3→4
- [x] Replace warning shows when a dataset exists

## Notes
Depends on CLOUD-12, CLOUD-14.

`/upload` (`src/app/upload/page.tsx`, server component) fetches the catalog and
renders `UploadWizard` (`src/components/UploadWizard.tsx`, client). Four steps with a
progress indicator: **Pick** (league → season cards — `PickStep` extracted from
HomeScreen into a shared `src/components/PickStep.tsx`), **File** (drag-drop / browse
+ a download-template link → new `GET /api/datasets/template` route serving the
canonical `data/templates` CSV), **Preview** (POSTs `/api/datasets/validate`; shows
errors/warnings and the computed standings table styled with the design tokens), and
**Confirm** (POSTs `/api/datasets`, then routes to the returned permalink).

- **Errors block 3→4:** the Preview→Continue button is disabled whenever the
  validate response has errors.
- **Replace warning:** the Confirm step shows a "Replaces existing data" banner (and
  the CTA reads "Replace & open") when the chosen (league, season) already has a
  dataset, derived from the catalog's `hasData`.
- Upload is **soccer-only** for now (the validate/commit routes are soccer-only), so
  the sport is filtered to soccer; broaden when F1 upload lands.

Verified live (Playwright + live DB, test dataset removed after): an invalid CSV
shows errors and disables Continue; selecting Premier League 2025-26 (seeded) surfaces
the replace warning without committing; the happy path uploads a CSV to the empty PL
2024-25 and lands on `/soccer/premier-league/2024-25` with the chart rendered. The
template route returns the CSV as an attachment. Gates: typecheck + lint + 96 tests
pass (no component-test infra; interactive flow covered by the browser check).

## Design
The design mocks only the **entry point** (the dashed upload row + a toast), not
the full 4-step wizard. Build the wizard using the design system tokens/components
in `Squiggle.html` (cards, CTA button, chips, panel/line colors, Archivo + Spline
Sans Mono). The preview step should reuse the `BumpChart` + computed-table styling.
