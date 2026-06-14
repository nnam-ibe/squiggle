# Tickets — Squiggle (v1)

Derived from `TECHNICAL_DESIGN.md`. Organized into epics matching the build
phases. IDs are stable references; `→` marks dependencies.

**Legend:** `S`=small (≤½ day) · `M`=medium (1–2 days) · `L`=large (3+ days)

---

## EPIC 0 — Project scaffold & infrastructure

### CLOUD-1 · Initialize Next.js + TypeScript + Tailwind  ·  S
Scaffold the app with Next.js 15 (App Router), TypeScript (strict), Tailwind, ESLint/Prettier.
**AC:** `npm run dev` serves a placeholder homepage; lint + typecheck pass in CI.

### CLOUD-2 · Set up Postgres + Drizzle + migrations  ·  M  ·  → CLOUD-1
Provision Postgres (Neon/Supabase), add Drizzle, create the `datasets`,
`matches`, `rate_limit` tables and the migration workflow.
**AC:** migrations run against a local + hosted DB; a smoke query succeeds from the app.

### CLOUD-3 · Config loader with Zod validation  ·  M  ·  → CLOUD-1
Load `data/leagues/*.json` at boot, validate each against a Zod schema, expose
typed lookups (`getLeague`, `getSeasonRoster`, `getColor`, `getTieBreakers`,
`getF1PointsRules`). Boot/build fails on malformed config.
**AC:** all 6 existing configs load; a deliberately broken config fails validation with a clear error; unit tests cover lookups.

### CLOUD-4 · CI pipeline + Vitest harness  ·  S  ·  → CLOUD-1
GitHub Actions (or equivalent) running typecheck, lint, and Vitest on PRs.
**AC:** a trivial test runs green in CI; failing test blocks merge.

---

## EPIC 1 — Standings engine (soccer)

### CLOUD-5 · Domain types  ·  S  ·  → CLOUD-1
Define `NormalizedResult`, `EntityStanding`, `RoundSnapshot`, `Standings`,
`SportAdapter`, `RowError` in `domain/types.ts`.
**AC:** types compile and are imported by the engine modules.

### CLOUD-6 · Soccer adapter — accumulate stats  ·  M  ·  → CLOUD-5, CLOUD-3
Implement `accumulate()` for soccer: played/W/D/L, GF/GA/GD, points (from league
config), and retained head-to-head sub-results.
**AC:** unit tests assert correct aggregates for a small fixture; points use the league's `pointsForWin/Draw`.

### CLOUD-7 · Config-driven tie-breaker resolver  ·  L  ·  → CLOUD-6
Implement `ranking.ts` grouping algorithm. Support criteria: `points`,
`goal_difference`, `goals_scored`, `away_goals_scored`, `head_to_head_points`,
`head_to_head_goal_difference`, `head_to_head_away_goals`, `playoff` (skip),
`alphabetical`. H2H operates on the tied group's mini-table and falls through when
members haven't all played each other equally.
**AC:** tests cover La Liga/Serie A H2H-before-GD, Bundesliga/Ligue 1 H2H-after-GD, a 3-team mini-table, the unequal-meetings fall-through, and `playoff` skip → always total-ordered output.

### CLOUD-8 · Snapshot-by-date engine  ·  M  ·  → CLOUD-7
Implement `standings.ts`: compute `roundEndDate[r]`, then per round snapshot all
results played on/before the cutoff and rank them.
**AC:** test with a postponed match (played after a later round's end date) shows it in the correct round's snapshot; partial seasons stop at the last round with data.

### CLOUD-9 · Engine accuracy test vs. real season  ·  M  ·  → CLOUD-8
Add a full real soccer season CSV (e.g. PL 2024-25) as a fixture and assert the
computed final table matches the official table exactly.
**AC:** final positions, points, and GD match the official table for the chosen season.

---

## EPIC 2 — Upload pipeline (soccer)

### CLOUD-10 · CSV parse + soccer row normalization  ·  M  ·  → CLOUD-6
Parse uploads with Papa Parse; map rows to `NormalizedResult` via the soccer
adapter's `parseRow`; case-insensitive headers; collect structured row errors.
**AC:** valid template parses; malformed rows yield `{field,row,message}` errors.

### CLOUD-11 · Validation rules (errors vs. warnings)  ·  M  ·  → CLOUD-10, CLOUD-3
Zod + roster checks. Hard errors: unknown sport/league, missing columns, bad
numbers/dates, >2 MB or >5,000 rows. Warnings: unknown team (warn-only), partial
season, duplicate-looking fixtures.
**AC:** unit tests for each error and warning category; unknown teams warn (don't block).

### CLOUD-12 · `POST /api/datasets/validate` (preview, no save)  ·  M  ·  → CLOUD-11, CLOUD-8
Route returns `{errors, warnings, previewTable, roundsPresent}` by parsing,
validating, and computing standings — persisting nothing.
**AC:** returns a computed final table + warnings for a valid file; returns errors with 4xx for invalid.

### CLOUD-13 · IP rate limiting  ·  S  ·  → CLOUD-2
`sha256(ip+salt)` hashing; per-hour window counter in `rate_limit`; 11th
upload/hour → HTTP 429. Never store raw IP.
**AC:** unit/integration test proves the 11th request in an hour is rejected; window resets next hour.

### CLOUD-14 · `POST /api/datasets` commit + replace-on-reupload  ·  M  ·  → CLOUD-12, CLOUD-13
Re-validate server-side; rate-limit; transaction deletes any existing
`(league,season)` and inserts the new dataset + matches; sets `is_complete`/`rounds_present`.
**AC:** committing replaces an existing dataset atomically; partial upload sets `is_complete=false`; returns the permalink.

---

## EPIC 3 — Dataset view + bump chart (soccer)

### CLOUD-15 · `GET /api/datasets/:sport/:league/:season`  ·  S  ·  → CLOUD-8, CLOUD-14
Return raw matches + computed `Standings` for a dataset (404 if none).
**AC:** returns standings JSON for a seeded dataset; 404 for unknown.

### CLOUD-16 · Dataset view page (server component)  ·  M  ·  → CLOUD-15
`/[sport]/[league]/[season]` fetches matches, runs the engine server-side, passes
`Standings` + color map to the chart. Shareable permalink; handles empty/404.
**AC:** visiting a seeded permalink renders the chart; unknown route shows a friendly not-found.

### CLOUD-17 · BumpChart component (static interactive)  ·  L  ·  → CLOUD-16
visx SVG: inverted Y (1 at top), round X-axis, one step-line per entity colored
from config, right-edge labels with final position.
**AC:** renders a 20-team season resembling the reference image; lines use config colors; final-position labels align at the right edge.

### CLOUD-18 · Tap-to-highlight + tooltips  ·  M  ·  → CLOUD-17
Tap/click a line (or label) to bold it and dim others; tap empty space to reset.
Generous touch hit-areas. Tooltip shows round, position, points, W-D-L/GD.
**AC:** on a phone-sized viewport, tapping a team isolates its line; tooltip shows correct values; reset works.

### CLOUD-19 · Duplicate-color disambiguation  ·  S  ·  → CLOUD-17
When two entities share a color in a season, render the second with a dashed
stroke (per `data/README.md`).
**AC:** Juventus/Udinese (and Freiburg/Heidenheim) render as solid vs. dashed and remain distinguishable.

### CLOUD-20 · Mobile responsiveness pass  ·  M  ·  → CLOUD-18
Legible from ~320px; horizontal scroll for many rounds; touch targets sized for fingers.
**AC:** manual check on 320/375/414px widths; no overflow/clipping; tap-highlight usable.

---

## EPIC 4 — Formula 1 support

### CLOUD-21 · F1 adapter — points rules + parsing  ·  L  ·  → CLOUD-5, CLOUD-3
`parseRow` for the F1 CSV; `accumulate` applying `data/formula-1.json` points
rules: race points by finish, fastest-lap (+1, 2019–2024, top-10 only), sprint by
era. Handle `DNF`/`NC`/blank as no points.
**AC:** unit tests for each points-rule era; fastest-lap only awarded when eligible; DNF scores 0.

### CLOUD-22 · F1 drivers vs. constructors standings  ·  M  ·  → CLOUD-21, CLOUD-8
Compute both entity types from the same results (constructors = sum of a team's
drivers). Add F1 `count_back` tie-breaker (most wins, then 2nds, …).
**AC:** drivers and constructors standings both correct on a fixture; count_back breaks an equal-points tie correctly.

### CLOUD-23 · F1 entity toggle on dataset view  ·  S  ·  → CLOUD-22, CLOUD-16
`?entity=drivers|constructors` switches the computed standings server-side; UI toggle.
**AC:** toggling re-renders the chart for the selected entity; permalink reflects the mode.

### CLOUD-24 · F1 driver line styling  ·  S  ·  → CLOUD-19, CLOUD-23
In the drivers chart, teammates share the constructor color, disambiguated by line style.
**AC:** two drivers of the same team render distinguishably with that team's color.

### CLOUD-25 · F1 accuracy + parser tests  ·  M  ·  → CLOUD-22
Seed a recent F1 season and assert final drivers + constructors standings match official.
**AC:** final championship tables match the official result for the seeded season.

---

## EPIC 5 — Catalog homepage + polish

### CLOUD-26 · `GET /api/catalog`  ·  M  ·  → CLOUD-3, CLOUD-2
Merge league config (sports/leagues) with DB (which `(league,season)` have data)
into the selector data model.
**AC:** returns sports → leagues → seasons, marking which seasons have datasets.

### CLOUD-27 · Homepage cascading selectors  ·  M  ·  → CLOUD-26
Sport → League → Season selectors; only leagues/seasons with data selectable;
prominent "Upload data" CTA; empty state when no data.
**AC:** selecting through to a season navigates to its permalink; empty state shows when DB is empty.

### CLOUD-28 · Upload wizard UI  ·  L  ·  → CLOUD-12, CLOUD-14
4-step flow: pick sport/league/season → drop CSV → preview (computed table +
warnings/errors) → confirm (with replace warning). Download-template link.
**AC:** full happy path uploads and lands on the permalink; errors block step 3→4; replace warning shows when a dataset exists.

### CLOUD-29 · Error/empty/loading states + a11y pass  ·  M  ·  → CLOUD-27, CLOUD-28
Consistent loading skeletons, error toasts, 404 pages; keyboard focus + color
contrast on selectors/chart controls.
**AC:** no dead-ends; basic a11y checks (focus order, contrast, labels) pass.

---

## EPIC 6 — Deploy & launch

### CLOUD-30 · Vercel + Postgres deployment  ·  M  ·  → CLOUD-14, CLOUD-16
Configure hosting, env vars (DB URL, IP salt), run migrations on deploy.
**AC:** production URL serves the app; uploads persist; permalinks work.

### CLOUD-31 · Seed validated launch datasets  ·  M  ·  → CLOUD-30, CLOUD-9, CLOUD-25
Upload a few verified seasons (e.g. PL 2024-25, one F1 season) so the homepage
isn't empty at launch.
**AC:** at least 2 datasets visible and rendering correctly in production.

### CLOUD-32 · Cross-device smoke test  ·  S  ·  → CLOUD-31
Manual pass on iOS/Android browsers + desktop: browse, view, tap-highlight, upload.
**AC:** core flows verified on at least one real phone and one desktop browser.

---

## Suggested milestones

- **M1 — Soccer MVP (shippable):** EPIC 0 → 1 → 2 → 3.
- **M2 — Multi-sport:** EPIC 4.
- **M3 — Launch:** EPIC 5 → 6.

## Pre-build verification (from `data/README.md` risks)
- [ ] Confirm exact La Liga & Serie A head-to-head regulations (feeds CLOUD-7 tests).
- [ ] Verify rosters/brand colors and per-league tie-breaker orders before seeding (CLOUD-31).
