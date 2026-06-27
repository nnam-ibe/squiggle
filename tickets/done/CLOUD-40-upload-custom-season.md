# CLOUD-40: Let upload pick any season (custom season input)

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
In the upload wizard, the **Season** step only offers buttons for the seasons
predefined in `data/leagues/<league>.json` (usually one or two). You can't upload a
season that isn't pre-listed — e.g. Premier League 1998-99. The backend already
supports this: `validateSoccerUpload` only *warns* (`no_roster`) for an unconfigured
season and the commit path passes the season string through. So this is a
frontend-only gap in `UploadWizard`.

## Scope
- `src/components/UploadWizard.tsx` step 1 (Pick): keep the predefined season buttons
  as quick-picks, but add a free-text input to enter any season (placeholder e.g.
  `1998-99`).
- Normalise input to the canonical soccer season format `YYYY-YY`
  (accept `1998/1999`, `1998-1999`, `1998/99`, `1998-99`; require consecutive years).
  Show an inline hint and keep "Next" disabled until the entered season is valid.
- Picking a predefined button clears the custom input and vice-versa.

## Acceptance Criteria
- [x] Can enter an arbitrary valid season (e.g. `1998-99`) and proceed through upload
- [x] Entered season normalises to `YYYY-YY`; the resulting permalink/display is correct
- [x] Invalid input (bad format / non-consecutive years) is blocked with a hint
- [x] Predefined quick-pick buttons still work; selection state stays consistent
- [x] typecheck / lint / tests pass

## Resolution
- `src/upload/season.ts` — `normalizeSeason(raw)`: accepts `1998-99` / `1998/1999` /
  `1998-1999` / `1998/99`, requires consecutive years + plausible range, returns the
  canonical `YYYY-YY` or null. Unit-tested in `season.test.ts` (incl. century rollover
  `1999-00` and rejections).
- `src/components/UploadWizard.tsx` — the Season step keeps the predefined quick-pick
  buttons and adds a free-text "Or enter another season" input. Typing sets the season
  to the normalised value (or null → "Next" disabled), shows a "Will be saved as …"
  hint when it reformats, and an inline hint when invalid. Picking a button clears the
  input; typing deselects the buttons.
- Verified live: PL + `1998/1999` → "Will be saved as 1998-99", Next enabled;
  `1998-97` → hint shown, Next disabled. No backend change (unknown-season teams are
  auto-colored, warn-only).

## Notes
Upload is soccer-only for now, so target the `YYYY-YY` format. No backend change
needed — unknown-season teams are auto-colored (warn-only).
