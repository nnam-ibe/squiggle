# CLOUD-35: Full-width layout (remove large desktop margins)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
On desktop the app sits in a narrow centered column with large empty margins on
either side. The dataset/details page caps at `max-w-[1180px]` (see
`src/app/[sport]/[league]/[season]/page.tsx:49`), which wastes horizontal space —
especially harmful for the bump chart, which then has to scroll (see CLOUD-36).
Make the chart experience fill the available width, with a sensible cap so it
doesn't stretch absurdly wide on ultra-wide monitors.

## Approach
- Remove/raise the `max-w-[1180px]` cap on the dataset page so the content fills
  the viewport width, keeping comfortable horizontal gutters (e.g. `px-4`/`sm:px-6`).
- Best practice for ultra-wide: keep a generous max-width cap (~`1600px`, or a
  Tailwind token like `max-w-screen-2xl`) centered with `mx-auto`, rather than
  truly edge-to-edge. Pick one cap and apply it consistently.
- Decide on home (`HomeScreen`, `max-w-[680px]`) and upload (`UploadWizard`,
  `max-w-[680px]`): these are reading-width forms and likely should stay narrow.
  Confirm during implementation; widen only if it reads better.

## Acceptance Criteria
- [x] Dataset/details page uses the full viewport width (minus gutters) up to the
      chosen ultra-wide cap; no large dead margins at 1280–1920px
- [x] An explicit max-width prevents over-stretching beyond ~1600px on ultra-wide
- [x] Mobile/tablet layout unchanged; no horizontal page scroll introduced
- [x] Home/upload width decision applied intentionally (kept narrow or widened)

## Notes
Directly enables CLOUD-36 (chart horizontal scroll) — widening the container gives
the chart room to fit without scrolling on desktop.

## Resolution
- Dataset page wrapper changed `max-w-[1180px]` → `w-full max-w-[1600px]`
  (`src/app/[sport]/[league]/[season]/page.tsx:49`), and the matching loading
  skeleton (`.../loading.tsx:4`) so there's no width jump on load.
- Cap chosen: **1600px** centered with `mx-auto` — fills the viewport on common
  laptop/desktop widths (no dead margins ≤1600px) while preventing over-stretch on
  ultra-wide. By the BumpChart fit math this makes the 38-round PL chart fit without
  horizontal scroll at ≥~1440px (the residual <~1440px case is CLOUD-36).
- **Home (`HomeScreen`) and Upload (`UploadWizard`) intentionally kept at
  `max-w-[680px]`** — they are reading-width forms and read better narrow.
- Verified: typecheck/lint/tests pass; served HTML confirms the 1600 cap. Browser
  extension was unavailable, so multi-width visual confirmation is deferred to CLOUD-36.
