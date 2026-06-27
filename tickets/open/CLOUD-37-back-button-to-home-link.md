# CLOUD-37: Replace top-left back button with a home hyperlink

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
The top-left control on inner pages is a back-arrow icon rendered as a bordered
square button. It already links to `/`, but it reads as a "back" affordance rather
than a clear link home. Replace it with a plain hyperlink to the home page (e.g. a
"Squiggle" wordmark or a "← Home" text link), removing the boxed back-button styling.

## Scope / files
- `src/app/[sport]/[league]/[season]/page.tsx` — header `<Link href="/">` wrapping
  `<Icon name="back" />` (around line 51).
- `src/components/UploadWizard.tsx` — header `<Link href="/">` wrapping
  `<Icon name="back" />` (around line 80).
- Consider removing the now-unused `"back"` case from `src/components/Icon.tsx` if
  nothing else uses it after this change.

## Acceptance Criteria
- [ ] No boxed back-arrow button on the dataset page or upload page
- [ ] A clearly-labelled hyperlink navigates to the home page (`/`) from both pages
- [ ] Accessible name reflects "home" (not "Back"); keyboard/focus styles intact
- [ ] `npm run lint` / `npm run typecheck` pass (remove dead `back` icon if unused)

## Notes
Keep the header layout (theme toggle, title block) otherwise unchanged.
