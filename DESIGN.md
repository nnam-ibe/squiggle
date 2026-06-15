# Design — Squiggle

The frontend (Epic 3 + the Epic 5 UI) should match the **Claude Design** handoff
bundled in `design/`. Build the visual output for real in React/Next.js + Tailwind;
don't copy the prototype's vanilla-React structure verbatim.

- **Source:** Claude Design export, fetched 2026-06-14
  (`https://api.anthropic.com/v1/design/h/BUzYmoThuA5EJNgdR7BA6Q?open_file=Squiggle.html`).
- **In repo:** `design/project/Squiggle.html` (tokens + all CSS), with components
  `design/project/Squiggle/{chart,screens,app,data}.jsx`. `tweaks-panel.jsx` is the
  design tool's own control panel — ignore it for production. `design/chats/` has
  the design conversation (intent).

## Chosen defaults (from `app.jsx` `TWEAK_DEFAULTS`)

| Token | Value |
|---|---|
| Theme | **dark default**, light variant supported (`data-theme` on `<html>`) |
| Accent | **`#ffb020`** (amber) — overrides the green `--accent` in the CSS at runtime |
| Fonts | **Archivo** (headings + body), **Spline Sans Mono** (numbers/labels) |
| Bump line shape | **smooth** (Catmull-Rom); `stepped` is an option |
| Line weight | **2.6px** |
| End pill | **code + position** (`code` style; `badge` adds a color chip) |
| Home picker layout | **cascading cards** |

## Color tokens (CSS variables — see `Squiggle.html` `:root`)

Dark: `--bg:#0a0d13`, `--panel:#11151f`, `--panel2:#161c28`, `--fg:#eef1f7`,
`--fg2:#a4adbe`, `--fg3:#6a7488`, `--line:rgba(255,255,255,0.08)`. Light variant
defined alongside. Background uses a radial gradient (`--bg-grad`). "No data" meta
uses `#e0894a`. Negative/loss stat red `#ff6b6b`.

Use these as Tailwind CSS variables / theme tokens rather than hardcoding.

## Screens & components → tickets

| Design piece (file) | Ticket(s) |
|---|---|
| `BumpChart` (`chart.jsx`): pinned `POS` y-gutter, smooth lines, gridlines, end pills, glow on selected, scrub-to-focus dot | **CLOUD-17** |
| Selected highlight + dim others, `StatCard` overlay, `Legend` chips, scrub | **CLOUD-18** |
| Dashed line + ring badge for shared colors | **CLOUD-19** |
| Horizontal scroll + pinned axis + scrollable legend chips (mobile) | **CLOUD-20** |
| `DatasetView` (`screens.jsx`): sticky header (back, icon, title + season pill, subtitle, theme toggle), F1 `Drivers/Constructors` segmented toggle | **CLOUD-16**, **CLOUD-23** |
| `HomeScreen`: brand, hero, 3 × `PickStep` cards (Sport→League→Season), CTA, upload row, `EmptyState` | **CLOUD-27** |
| Upload row entry point + toast (full wizard not mocked — follow the design system) | **CLOUD-28** |
| `EmptyState`, toast, theme toggle, `aria-label`s | **CLOUD-29** |
| Tokens: CSS variables, fonts, dark/light theme | **CLOUD-33** (new foundation) |

## Data contract the chart expects (maps to the standings engine output)

Each chart "row" = `{ id, name, short, cons?, color, dashed, finalPos, hist[] }`.
Each `hist[]` entry is a per-round snapshot:
- **Soccer:** `{ round, pos, pts, w, d, l, gd }`
- **F1:** `{ round, pos, pts, w (wins), pod (podiums) }`

`computeStandings` already produces position + points per round; the per-round
W/D/L, GD (soccer) and wins/podiums (F1) need to be surfaced in `EntityStanding.stats`
when wiring the chart (the soccer adapter tracks W/D/L/GD; the F1 adapter tracks
wins/podiums — both are in `stats` today).

## Reconciliations with TECHNICAL_DESIGN.md

- Bump lines: design default is **smooth (Catmull-Rom)**, not stepped. §9.1 updated.
- Accent/theme/fonts are now pinned by the design (above), and a **light/dark theme
  toggle** is part of the UI (new ticket CLOUD-33 covers the token/theme foundation).
