# PRD — Squiggle

**Status:** Draft v1
**Date:** 2026-06-14
**Owner:** diggingretail@gmail.com

---

## 1. Summary

**Squiggle** is a mobile-friendly web app that visualizes how teams (or drivers/constructors)
move through the standings of a league or championship over the course of a
season. Users upload raw results as a CSV; the app computes the standings table
after each round and renders an interactive "bump chart" of position over time
(à la the reference Premier League / Flourish charts).

The app supports multiple sports with different points and tie-breaker rules.
**v1 ships soccer (5 leagues) and Formula 1.** There are no user accounts;
anyone can upload, and uploaded datasets are saved to a shared backend so they
can be viewed later by anyone.

---

## 2. Goals & Non-Goals

### Goals (v1)
- Let a visitor browse existing datasets by **Sport → League → Season** on the homepage.
- Let anyone **upload a CSV of raw results** for a supported league + season.
- **Compute standings** from raw results using each league's official rules.
- Render an **interactive, mobile-first bump chart** of position over the season.
- **Persist** uploads to a shared database; each dataset has a **shareable URL**.

### Non-Goals (v1)
- User accounts, auth, profiles, or social features.
- Animated/replay charts (static interactive only for v1).
- Team logos/crests (brand **colors** only).
- Image/PNG export.
- Admin moderation/approval workflow.
- Live data ingestion via sports APIs (CSV upload only).
- Editing/correcting individual results in-app after upload.

---

## 3. Target Users
- Soccer and F1 fans who want to relive or analyze a season's shape.
- Content creators / writers who want a quick season-narrative visual.
- Casual visitors browsing pre-uploaded seasons on mobile.

---

## 4. Key Product Decisions (from interview)

| Area | Decision |
|---|---|
| CSV content | **Raw results**; app computes the table |
| Storage | **Shared backend + database** (cross-user, cross-device) |
| Chart type | **Static interactive** (no animation in v1) |
| Tech stack | No preference → **recommend Next.js + Postgres** (see §10) |
| Soccer tie-breakers | **Official per-league rules** (configurable per league) |
| F1 data | **Per-race finishing positions → points table** |
| F1 entity | **Drivers and Constructors**, viewer-selectable |
| Bad uploads | **Validate + preview** before save |
| Duplicate uploads | **One dataset per league+season**; re-upload replaces |
| Abuse control | **Minimal** (schema validation + size limits) for v1 |
| Branding | **Brand colors only**, no logos |
| Mobile interaction | **Tap a team to highlight/isolate** its line |
| v1 leagues | Premier League, Bundesliga, La Liga, **Ligue 1, Serie A**, **Formula 1** |
| Round logic | **By date played** (postponement-accurate) |
| Sharing | **Shareable URL** per dataset |
| Rosters & colors | **Hybrid** — bundle curated rosters/colors where available; warn + auto-color unknowns |
| F1 era support | **Current + recent (~last 10 yrs)** points/sprint/fastest-lap rules |
| Tie-breaker depth | **Full official**, incl. head-to-head for La Liga & Serie A |
| Incomplete seasons | **Render partial** — chart up to the latest completed round |
| Upload limits | **2 MB / 5,000 rows**; **10 uploads / hour / IP** |

---

## 5. User Flows

### 5.1 Browse & view (primary)
1. Homepage shows **Sport** selector (Soccer, Formula 1).
2. Select sport → **League/Series** selector (only leagues with data shown).
3. Select league → **Season** selector (only seasons with data shown).
4. Land on the **dataset view**: the bump chart for that league+season.
5. (F1 only) Toggle **Drivers ⇄ Constructors**.
6. Tap/click a team to **highlight/isolate**; tap empty space to reset.
7. URL is a permalink, e.g. `/soccer/premier-league/2025-26`.

### 5.2 Upload (open to anyone)
1. From homepage or dataset view, choose **Upload data**.
2. Select **Sport → League → Season** (or type a new season).
3. Drop/select a **CSV** file.
4. App **parses + validates**, shows **errors/warnings** and a **preview** of the
   computed final table (and a small preview of the chart).
5. If a dataset already exists for that league+season, warn that it will be
   **replaced**.
6. User confirms → data is saved → redirect to the dataset's permalink.

---

## 6. CSV Formats

> v1 accepts **raw results only**. Header names are case-insensitive; extra
> columns are ignored. A downloadable template is provided per sport.

### 6.1 Soccer
| Column | Required | Notes |
|---|---|---|
| `round` | yes | Matchday/round number (integer). |
| `date` | yes | ISO `YYYY-MM-DD`; the date the match was actually played. |
| `home_team` | yes | Must match the league's known team list (see §8). |
| `away_team` | yes | Must match the league's known team list. |
| `home_goals` | yes | Non-negative integer. |
| `away_goals` | yes | Non-negative integer. |

- 3 points for a win, 1 for a draw, 0 for a loss (standard; configurable per league for historical eras later).

### 6.2 Formula 1
| Column | Required | Notes |
|---|---|---|
| `round` | yes | Race number in the season. |
| `date` | yes | ISO `YYYY-MM-DD` race date. |
| `race` | recommended | Grand Prix name (display only). |
| `driver` | yes | Driver name. |
| `constructor` | yes | Team/constructor name (used for Constructors standings). |
| `finish_position` | yes | Integer finishing position; blank/`DNF`/`NC` = no points. |
| `fastest_lap` | optional | `true/false`; awards the fastest-lap point if rules apply. |
| `sprint_position` | optional | Finishing position in a sprint race, if any. |

- App applies the season's **points table** (e.g. 25-18-15-12-10-8-6-4-2-1) plus
  fastest-lap and sprint points where flagged. Points tables are versioned by
  season to handle era changes.
- **v1 era support:** the current points system plus rules used over roughly the
  last 10 years (covering modern fastest-lap and sprint variations). Older eras
  are out of scope for v1 and can be added as additional versioned configs.

---

## 7. Standings & Position Logic

### 7.1 General
- The app recomputes the full standings table from scratch from raw results.
- **X-axis = round/matchday index** (1..N), matching how fans read the chart.
- **Partial seasons are supported:** the chart renders up to the latest round that
  has results; later rounds are simply absent. No requirement that a season be
  complete to save or view.
- **Position is computed by date played:** the snapshot plotted at round *N* is
  the standings table built from **all matches with a play date on or before the
  date that round *N* concluded**. This correctly handles postponed/rescheduled
  games (a game from round 5 played later affects the table at the later date,
  not retroactively at round 5).
- Teams/drivers that have not yet appeared are not plotted until their first result.

### 7.2 Soccer tie-breakers (per-league config)
Applied in order; configurable per league because rules differ:
- **Premier League:** points → goal difference → goals scored → (then play-off/alphabetical).
- **Bundesliga:** points → goal difference → goals scored.
- **La Liga:** points → **head-to-head** (between tied teams) → goal difference → goals scored.
- **Serie A:** points → **head-to-head** → goal difference → goals scored.
- **Ligue 1:** points → goal difference → goals scored.

> Tie-breaker rules live in per-league config so adding leagues is data, not code.

### 7.3 F1
- Standings = cumulative championship points by date played.
- **Drivers** standings: points per driver. **Constructors**: summed per constructor.
- Tie-breaker: most race wins, then most 2nd-place finishes, etc. (countback).

---

## 8. Supported Leagues (v1)

| Sport | League/Series | Entities | Notes |
|---|---|---|---|
| Soccer | Premier League | 20 teams | GD tie-break |
| Soccer | Bundesliga | 18 teams | GD tie-break |
| Soccer | La Liga | 20 teams | head-to-head tie-break |
| Soccer | Serie A | 20 teams | head-to-head tie-break |
| Soccer | Ligue 1 | 18 teams | GD tie-break |
| Motorsport | Formula 1 | Drivers + Constructors | finish→points |

Each league ships with: known team/entity list (for validation), brand color
map, tie-breaker config, and points config.

> **Note (hybrid validation):** team lists change by season (promotion/relegation,
> F1 lineup changes). v1 ships **curated rosters + brand colors where available**
> and validates against the per-(league, season) roster. For anything unknown, it
> **warns** during validate+preview (not a hard reject) and **auto-assigns a
> distinct color**. This keeps quality high where we have data and stays usable
> where we don't.

---

## 9. Functional Requirements

### 9.1 Homepage
- Cascading selectors: Sport → League → Season, populated only from datasets
  that exist in the DB.
- Empty state with a clear "Upload data" call to action.

### 9.2 Upload
- Accept `.csv` only; **max 2 MB and 5,000 rows** (a full PL season is ~380 rows,
  an F1 season a few hundred, so this is generous headroom).
- Parse client- or server-side; **validate schema**, value ranges, and known
  entities.
- Show a **preview**: computed final standings table + warnings/errors list.
- Block save on hard errors; allow save with warnings.
- On save, **replace** any existing dataset for the same (sport, league, season).
- **Rate limit: 10 uploads / hour / IP** (no accounts in v1).

### 9.3 Chart / Dataset view
- Static interactive bump chart: y-axis = position (1 at top), x-axis = rounds.
- Distinct **brand color** per team; label at the right edge (final position).
- **Tap/click to highlight**: selected line bolded, others dimmed; tap to reset.
- Tooltip on hover/tap point: round, position, points, (soccer) W-D-L / GD.
- (F1) Drivers ⇄ Constructors toggle.
- Responsive: usable from ~320px width up.
- Permalink reflects the current dataset (and F1 entity mode).

### 9.4 Persistence
- Store raw uploaded results + computed snapshots (or recompute on read).
- Each dataset addressable by `(sport, league, season)` → stable URL.

---

## 10. Recommended Technical Approach

> No stack preference was given; this is the recommendation.

- **Framework:** Next.js (React, TypeScript) — SSR for fast first paint + shareable
  URLs, API routes for upload/fetch, strong mobile support.
- **Database:** Postgres (e.g. Supabase/Neon) — relational fits leagues, seasons,
  matches, standings snapshots.
- **CSV parsing:** Papa Parse.
- **Charting:** a library with good line/tooltip control and mobile touch support
  (e.g. visx/D3 for full control, or Recharts/ECharts for speed). Decide in design.
- **Hosting:** Vercel (pairs with Next.js) + managed Postgres.
- **Data model (sketch):**
  - `leagues` (id, sport, name, slug, config: tie-breakers, points, colors)
  - `seasons` (id, league_id, label e.g. "2025-26")
  - `datasets` (id, season_id, uploaded_at, source_filename) — one current per season
  - `matches` (id, dataset_id, round, date, participants, scores/results)
  - (optional) `standings_snapshots` (dataset_id, round, entity, position, points, …)

---

## 11. Out of Scope / Future Versions
- More sports (NBA, NFL, cricket, rugby, etc.) and more leagues.
- Animated **replay** chart with a play button.
- **Logos/crests** and richer branding.
- **PNG/image export** and social cards.
- Accounts, ownership of uploads, and **moderation/approval** queue.
- Editing results / versioned uploads / dataset history.
- Date-accurate timeline x-axis (calendar) option in addition to round index.
- Direct API ingestion (no manual CSV).
- Multiple/named dataset versions per league+season.

---

## 12. Resolved Decisions (formerly open questions)
1. **Rosters & colors:** Hybrid — bundle curated rosters + brand colors where
   available; warn and auto-assign colors for unknown entities. *(See §8 note.)*
2. **F1 era support:** Current + recent (~last 10 years) points/fastest-lap/sprint
   rules; older eras out of scope for v1. *(See §6.2.)*
3. **Tie-breaker depth:** Full official rules, including head-to-head mini-tables
   for La Liga and Serie A. *(See §7.2.)*
4. **Upload limits:** 2 MB / 5,000 rows per file; 10 uploads / hour / IP. *(See §9.2.)*
5. **Incomplete seasons:** Render partial — chart up to the latest completed round;
   no requirement to be a full season. *(See §7.1.)*

### Remaining items to confirm during design/build
- Exact **head-to-head computation rules** per league (La Liga vs Serie A differ in
  ordering and what happens when more than two teams are tied).
- Concrete **source** for the curated roster/color JSON (manual entry vs. a
  one-time scrape) and which seasons get curated data at launch.

---

## 13. Success Metrics (directional)
- A user can go from homepage → uploaded CSV → rendered chart in **< 2 minutes**.
- Chart is **legible and interactive on a phone** (tap-to-highlight works).
- Standings computed match official tables for a **sample validated season** per league.
