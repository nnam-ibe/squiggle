# CLOUD-33: Design system foundation (tokens, fonts, dark/light theme)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 (foundation) — Port the design's token system from `design/project/Squiggle.html`
so all UI tickets share it: CSS variables for colors (dark + light), the amber
accent (`#ffb020`), fonts (Archivo + Spline Sans Mono), radius scale, and a
dark/light **theme toggle** (`data-theme` on `<html>`). Wire into Tailwind theme.

## Acceptance Criteria
- [x] Color/spacing/radius tokens available as CSS variables + Tailwind theme
- [x] Archivo + Spline Sans Mono loaded; headings/body/mono mapped
- [x] Dark default with a working light variant; theme toggle persists choice
- [x] Accent is `#ffb020`

## Notes
- `src/app/globals.css` — ported tokens: `:root`/`[data-theme="dark"]` (default) +
  `[data-theme="light"]` overrides (bg, panel/panel2/raise, line/line2, fg/fg2/fg3,
  chip, shadow), amber `--accent`. `@theme inline` exposes them as Tailwind
  utilities (`bg-panel`, `text-fg2`, `border-line`, `font-head`/`font-mono`,
  `rounded-card/panel/field/pill`).
- `src/app/layout.tsx` — Archivo + Spline Sans Mono via `next/font`; `data-theme="dark"`
  default; inline `NO_FLASH_SCRIPT` sets the theme pre-paint from localStorage / OS.
- `src/lib/theme.ts` — `resolveInitialTheme()` + `NO_FLASH_SCRIPT` + storage key.
- `src/components/ThemeToggle.tsx` — reads `data-theme` via `useSyncExternalStore`
  (no setState-in-effect; SSR-safe), toggles + persists to localStorage.
- `src/components/Icon.tsx` — minimal icon set (squiggle, sun, moon); grows later.
- `src/app/page.tsx` — temporary token/theme preview (real homepage is CLOUD-27).

Verified: `next build` succeeds (fonts load; home static, both API routes present),
served HTML shows `data-theme="dark"`, brand/hero/Archivo/no-flash script.
2 unit tests for `resolveInitialTheme`. 73 tests (71 pass, 2 DB-skipped in CI).
