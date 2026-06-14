# Technical Design — Squiggle

**Status:** Draft v1
**Date:** 2026-06-14
**Companion docs:** `PRD.md` (product), `data/README.md` (config & CSV schema)

This document describes how to build v1. It assumes the decisions in the PRD:
raw-results upload, app-computed standings, shared DB, static interactive chart,
soccer (5 leagues) + F1, by-date-played positions, replace-on-reupload, minimal
guardrails, brand colors only, tap-to-highlight.

---

## 1. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│                       Next.js (App Router)                     │
│                                                                │
│  Server Components / Route Handlers        Client Components    │
│  ─ catalog (sports/leagues/seasons)        ─ Upload wizard      │
│  ─ dataset fetch + standings compute       ─ BumpChart (interactive) │
│  ─ upload validate / commit                ─ Selectors          │
│         │                    │                                  │
│         ▼                    ▼                                  │
│  ┌─────────────┐     ┌──────────────────┐                       │
│  │ config (fs) │     │ domain/standings │  ← pure, tested core   │
│  │ data/*.json │     │ + sport adapters │                       │
│  └─────────────┘     └──────────────────┘                       │
│                              │                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               ▼
                       ┌──────────────┐
                       │  Postgres    │  datasets, matches, rate_limit
                       └──────────────┘
```

- **League configs are files** (`data/*.json`), version-controlled, the source of
  truth for format/rosters/colors/tie-breakers/points. They are *not* in the DB.
- **The DB stores only uploaded data** (datasets + their matches) and rate-limit state.
- **Standings are computed, not stored** (datasets are tiny — ≤380 rows). Compute
  on read in a pure, well-tested domain module. (Caching is a later optimization;
  see §6.5.)

---

## 2. Tech stack (recommended)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR for shareable URLs + fast first paint; route handlers for the API; one repo. |
| DB | **Postgres** (Neon or Supabase) | Relational fit; serverless-friendly hosting. |
| DB access | **Drizzle ORM** | Type-safe, lightweight, SQL-first; easy migrations. |
| CSV parsing | **Papa Parse** | Robust, streaming, handles messy CSVs. |
| Validation | **Zod** | Schema + per-row validation with good error messages. |
| Charting | **visx (D3 primitives) + React** | Full control of the bump chart: inverted axis, step lines, right-edge labels, custom hit areas for mobile tap-to-highlight. (Alt: Recharts for speed, less control.) |
| Styling | **Tailwind CSS** | Fast mobile-first responsive work. |
| Rate limit | **DB table** (or Upstash Redis if available) | No accounts; key by hashed IP. |
| Hosting | **Vercel** + managed Postgres | Pairs with Next.js. |
| Tests | **Vitest** | Fast unit tests for the domain core. |

> All stack picks are swappable; the domain core (§6) is framework-agnostic pure
> TypeScript so it doesn't depend on any of these.

---

## 3. Repository structure

```
src/
├── app/
│   ├── page.tsx                     # homepage: sport→league→season selectors
│   ├── [sport]/[league]/[season]/
│   │   └── page.tsx                 # dataset view (server) → renders BumpChart
│   ├── upload/page.tsx              # upload wizard (client)
│   └── api/
│       ├── catalog/route.ts         # GET available sports/leagues/seasons
│       └── datasets/
│           ├── validate/route.ts    # POST CSV → preview + warnings (no save)
│           └── route.ts             # POST commit; GET by league+season
├── domain/                          # PURE, framework-free, unit-tested
│   ├── types.ts                     # NormalizedResult, Standings, Snapshot…
│   ├── standings.ts                 # snapshot-by-date engine
│   ├── ranking.ts                   # config-driven tie-breaker resolver
│   └── sports/
│       ├── soccer.ts                # soccer adapter (parse, stats, criteria)
│       └── f1.ts                    # F1 adapter (parse, points, criteria)
├── config/
│   └── leagues.ts                   # loads + validates data/*.json at startup
├── db/
│   ├── schema.ts                    # Drizzle schema
│   └── client.ts
└── components/
    ├── BumpChart.tsx
    ├── Selectors.tsx
    └── UploadWizard.tsx
data/                                # league configs + CSV templates (exists)
```

---

## 4. Database schema

```sql
-- One current dataset per (league, season). Re-upload replaces it.
CREATE TABLE datasets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport         text NOT NULL,              -- 'soccer' | 'motorsport'
  league_id     text NOT NULL,              -- matches data/leagues/<id>.json
  season        text NOT NULL,              -- '2024-25' | '2025'
  source_filename text,
  row_count     integer NOT NULL,
  rounds_present integer NOT NULL,          -- max round with results
  is_complete   boolean NOT NULL DEFAULT false,
  uploader_ip_hash text,                    -- sha256(ip + salt); never raw IP
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, season)
);

-- Raw results = source of truth. Sport-specific fields live in payload jsonb.
CREATE TABLE matches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id  uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  round       integer NOT NULL,
  played_on   date NOT NULL,
  payload     jsonb NOT NULL,               -- see below
  CONSTRAINT  payload_shape CHECK (jsonb_typeof(payload) = 'object')
);
CREATE INDEX matches_dataset_idx ON matches (dataset_id, round);

-- IP-based rate limiting (10 uploads/hour). Swap for Redis if available.
CREATE TABLE rate_limit (
  ip_hash     text NOT NULL,
  window_start timestamptz NOT NULL,
  count       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_start)
);
```

`payload` shapes:
- **soccer:** `{ "home_team": "...", "away_team": "...", "home_goals": 2, "away_goals": 0 }`
- **f1:** `{ "race": "...", "driver": "...", "constructor": "...", "finish_position": 1, "fastest_lap": false, "sprint_position": 2 }`

Replacement is transactional: `DELETE FROM datasets WHERE league_id=$1 AND season=$2`
(cascades to matches) then insert the new dataset + matches.

---

## 5. Configuration loading

- `src/config/leagues.ts` reads all `data/leagues/*.json` at startup, validates
  each against a **Zod schema** (fails the build/boot on malformed config), and
  exposes typed lookups: `getLeague(id)`, `getSeasonRoster(id, season)`,
  `getColor(id, season, entity)`, `getTieBreakers(id)`, `getF1PointsRules()`.
- Roster lookup powers upload validation; color lookup powers the chart; tie-breaker
  and points config drive the domain engine — so adding a league is **data-only**.

---

## 6. Domain core — the standings engine (the heart)

Pure TypeScript, no I/O. Same engine for both sports via a small adapter interface.

### 6.1 Key types

```ts
type NormalizedResult = {
  round: number;
  playedOn: string;        // ISO date
  // soccer:
  homeTeam?: string; awayTeam?: string; homeGoals?: number; awayGoals?: number;
  // f1:
  driver?: string; constructor?: string; finishPosition?: number | null;
  fastestLap?: boolean; sprintPosition?: number | null;
};

type EntityStanding = {
  entity: string;          // team / driver / constructor name
  position: number;        // 1 = top
  points: number;
  stats: Record<string, number>;  // played, won, drawn, lost, gf, ga, gd … (sport-specific)
};

type RoundSnapshot = { round: number; cutoffDate: string; standings: EntityStanding[] };
type Standings = { entityType: 'team' | 'driver' | 'constructor'; rounds: RoundSnapshot[] };
```

### 6.2 Snapshot-by-date algorithm (handles postponements)

The x-axis is the **round index**, but a round's snapshot reflects everything
**actually played** by that round's end date:

```
1. roundEndDate[r] = max(playedOn) over results where result.round === r
2. cutoffs = sorted distinct round numbers 1..maxRound
3. for each round r:
     cutoff = roundEndDate[r]
     included = all results with playedOn <= cutoff
     stats   = accumulate(included)          // via sport adapter
     ranked  = rank(stats, tieBreakers)      // §6.4
     snapshot[r] = ranked
```

A game from round 5 postponed and played after round 10's end date is therefore
counted in round 10's snapshot (its real date), not retroactively at round 5 —
exactly the "by date played" decision. Complexity is trivial (≤38 rounds ×
≤20 entities), so the naive recompute-per-round is fine.

### 6.3 Sport adapter interface

```ts
interface SportAdapter {
  entityTypes: ('team' | 'driver' | 'constructor')[];   // f1 → both
  parseRow(raw: Record<string,string>, ctx): NormalizedResult | RowError;
  accumulate(results: NormalizedResult[], entityType): Map<string, EntityStats>;
  criteria: Record<string, CriterionFn>;                // named tie-break fns
}
```

- **soccer** (`accumulate`): for each match add played/W/D/L, goals for/against,
  GD, points (3/1/0 from league config). Also retain the head-to-head sub-results
  so `head_to_head_*` criteria can build mini-tables.
- **f1** (`accumulate`): apply the season's points rules (`data/formula-1.json`):
  race points by `finishPosition`, `+1` fastest lap if 2019–2024 and top-10,
  sprint points by `sprintPosition`. For `entityType='constructor'`, sum a team's
  drivers. Retain finish-position counts for the `count_back` tie-break.

### 6.4 Config-driven tie-breaker resolver (`ranking.ts`)

Tie-breakers are an **ordered** list from config (§ `data/README.md` vocabulary).
We use a **grouping** approach so `head_to_head_*` correctly means "mini-table
among only the tied teams":

```
rank(stats, tieBreakers):
  groups = [ allEntities ]                       # one big tied group
  for criterion in tieBreakers:
    newGroups = []
    for group in groups:
      if group.size == 1: keep as-is; continue
      value = criterionFn(entity, { group, results })   # H2H uses `group`
      subdivide group by value (desc); append ordered subgroups
    groups = newGroups
  flatten groups → assign positions 1..n
```

- `head_to_head_*` criteria compute their value from results **restricted to the
  current group's members**. They are **skipped for a group** if its members have
  not all played each other the same number of times (per La Liga/Serie A rule),
  falling through to the next criterion.
- `playoff` is non-computable → the resolver **skips** it and continues.
- `alphabetical` is the deterministic final fallback so positions are always total-ordered.

This makes Bundesliga/Ligue 1 (H2H *after* GD) vs. La Liga/Serie A (H2H *before*
GD) purely a matter of list order in config — no per-league code.

### 6.5 Caching (deferred)

Compute-on-read for v1. If profiling shows it matters, add a
`standings_snapshots` cache table written at commit time and invalidated on
re-upload. Not needed for launch.

---

## 7. Upload pipeline

```
Client picks sport/league/season + CSV
        │  multipart POST
        ▼
/api/datasets/validate ── parse (Papa) → normalize (adapter.parseRow)
        │                → validate (Zod + roster check, warn-only on unknowns)
        │                → compute standings (preview only)
        ▼
returns { errors[], warnings[], previewTable, roundsPresent } — NOTHING saved
        │
   user reviews preview, confirms (warns if dataset exists → "will replace")
        ▼
/api/datasets (commit) ── rate-limit check (10/hr/IP)
        │              → re-validate server-side (never trust client)
        │              → transaction: delete existing (league,season) + insert
        ▼
redirect → /[sport]/[league]/[season]
```

Validation rules:
- **Hard errors (block save):** unknown sport/league, missing required columns,
  non-numeric scores/positions, unparseable dates, file > 2 MB or > 5,000 rows.
- **Warnings (allow save):** team/driver not in the season roster (auto-colored),
  fewer rounds than the league's full season (→ `is_complete=false`),
  duplicate-looking fixtures.

---

## 8. API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/catalog` | Sports + leagues (from config) and which `(league,season)` have datasets (from DB), for the homepage selectors. |
| POST | `/api/datasets/validate` | Multipart CSV → `{errors, warnings, previewTable, roundsPresent}`. No persistence. |
| POST | `/api/datasets` | Commit a validated upload. Rate-limited. Replaces existing. Returns permalink. |
| GET | `/api/datasets/:sport/:league/:season` | Raw matches + computed standings (`?entity=drivers\|constructors` for F1). Also consumed directly by the server component. |

---

## 9. Frontend

- **`/` homepage** — three cascading selectors (Sport → League → Season),
  populated from `/api/catalog`; only leagues/seasons with data are selectable.
  Prominent "Upload data" CTA + empty state.
- **`/[sport]/[league]/[season]` dataset view** — server component fetches matches,
  runs the domain engine, passes `Standings` + color map to `<BumpChart>`. F1 adds
  a Drivers/Constructors toggle (`?entity=`), recomputed server-side. URL is the
  shareable permalink.
- **`/upload` wizard** — step 1 sport/league/season, step 2 drop CSV, step 3
  preview (computed final table + warnings/errors), step 4 confirm (+ replace warning).

### 9.1 BumpChart component
- SVG via visx. Y-axis **inverted** (position 1 at top), x-axis = rounds.
- One `path` per entity, **step interpolation** (like the reference images),
  colored from config; entity label + final position at the right edge.
- **Tap/click to highlight:** selected line bold + full opacity, others dimmed;
  tap empty space to reset. Generous touch hit-areas (invisible thick stroke).
- **Duplicate-color disambiguation** (per `data/README.md`): when two entities
  share a color in a season, the second gets a dashed stroke.
- Tooltip on point: round, position, points, and (soccer) W-D-L / GD.
- Mobile-first: horizontal scroll for many rounds; legible from ~320px.

---

## 10. Cross-cutting

- **Rate limiting:** hash IP (`sha256(ip + SALT)`); increment per hour window in
  `rate_limit`; reject the 11th upload/hour with HTTP 429.
- **Privacy:** never store raw IPs.
- **Limits:** enforce 2 MB / 5,000 rows at the route boundary before parsing.
- **Errors:** structured `{ field, row, message }` so the wizard can show a clear list.

---

## 11. Testing strategy

Highest-value tests live on the pure domain core:

1. **Standings accuracy** — feed a full real season CSV (e.g. PL 2024-25) and
   assert the final table matches the official table.
2. **Tie-breakers** — targeted fixtures for La Liga / Serie A **head-to-head**
   (incl. a 3-team tie mini-table and the "not all played each other" fall-through);
   Bundesliga/Ligue 1 H2H-after-GD ordering.
3. **By-date snapshotting** — a fixture with a postponed match played several
   rounds later; assert it appears in the correct round's snapshot, not its
   nominal round.
4. **F1 points** — fastest-lap point only 2019–2024 & top-10; sprint scoring per
   era; constructors = sum of drivers; `count_back` tie-break.
5. **Parser/validation** — malformed rows, unknown teams (warn not error), DNF/NC.

Plus a couple of API integration tests (validate → commit → replace).

---

## 12. Build phases

| Phase | Deliverable |
|---|---|
| **0 — Scaffold** | Next.js + TS + Tailwind, Drizzle + Postgres, config loader with Zod, CI + Vitest. |
| **1 — Engine (soccer)** | `domain/` standings + ranking + soccer adapter, fully unit-tested against a real PL season. |
| **2 — Upload (soccer)** | validate/commit routes, parser, rate limit, replace-on-reupload. |
| **3 — View + chart (soccer)** | dataset page + `<BumpChart>` (static interactive, tap-highlight, mobile). |
| **4 — Formula 1** | F1 adapter (points rules, drivers/constructors), entity toggle, F1 tests. |
| **5 — Catalog + polish** | homepage selectors, permalinks, empty states, limits/error UX. |
| **6 — Deploy** | Vercel + Postgres, seed a couple of validated seasons, smoke test on mobile. |

Soccer is shippable end-to-end after Phase 3; F1 layers on without touching the
engine's core.

---

## 13. Risks / open implementation items

1. **Exact head-to-head regulations** — encode La Liga vs. Serie A precisely
   (ordering + 3+ team mini-tables); covered by config + targeted tests, but the
   rule text must be confirmed (flagged in `data/README.md`).
2. **Roster/color accuracy** — colors and tie-break orders are best-effort; verify
   before trusting standings for display.
3. **Serverless rate-limit races** — DB upsert with a unique window key avoids
   double counting; revisit with Redis if traffic grows.
4. **Chart legibility at 20 lines on small screens** — tap-to-highlight is the
   mitigation; validate on real devices in Phase 3.
