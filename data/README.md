# Data & Config — Squiggle

Starter data files for v1. See `../PRD.md` for product context.

```
data/
├── README.md                     ← this file
├── templates/                    ← downloadable CSV templates shown to uploaders
│   ├── soccer-results-template.csv
│   └── f1-results-template.csv
└── leagues/                      ← per-league config: format, tie-breakers, rosters, colors
    ├── premier-league.json
    ├── bundesliga.json
    ├── la-liga.json
    ├── serie-a.json
    ├── ligue-1.json
    └── formula-1.json
```

---

## CSV upload formats

Header names are **case-insensitive**; unknown columns are ignored. Limits:
**max 2 MB / 5,000 rows**.

### Soccer (`templates/soccer-results-template.csv`)
| Column | Required | Notes |
|---|---|---|
| `round` | yes | Matchday number (integer). |
| `date` | yes | `YYYY-MM-DD`, the date the match was actually played. |
| `home_team` / `away_team` | yes | Validated against the season roster (warn-only if unknown). |
| `home_goals` / `away_goals` | yes | Non-negative integers. |

### Formula 1 (`templates/f1-results-template.csv`)
| Column | Required | Notes |
|---|---|---|
| `round` | yes | Race number in the season. |
| `date` | yes | `YYYY-MM-DD` race date. |
| `race` | recommended | Grand Prix name (display only). |
| `driver` | yes | Driver name. |
| `constructor` | yes | Team name; used for the Constructors standings. |
| `finish_position` | yes | Integer; blank / `DNF` / `NC` = classified out of points. |
| `fastest_lap` | optional | `true`/`false`; awards the point only if rules + finish position qualify. |
| `sprint_position` | optional | Finishing position in a sprint, if the round had one. |

> **Position is computed by date played.** The standings snapshot plotted at
> round *N* is built from every match whose `date` is on or before the date round
> *N* concluded — so a postponed game affects the table at its real play date.

---

## League config schema (`leagues/*.json`)

```jsonc
{
  "id": "premier-league",          // url slug
  "sport": "soccer",               // "soccer" | "motorsport"
  "name": "Premier League",
  "country": "England",
  "format": {
    "teams": 20, "rounds": 38,
    "pointsForWin": 3, "pointsForDraw": 1, "pointsForLoss": 0
  },
  "tieBreakers": ["points", "goal_difference", ...],  // applied in order, see vocab below
  "tieBreakerNotes": "...",        // human-readable explanation of the official rule
  "seasons": {
    "2024-25": {
      "status": "complete",        // see status values below
      "teams": [ { "name": "...", "short": "ARS", "color": "#EF0107" } ]
    }
  }
}
```

`status` values: `complete` (full verified season), `in_progress` (ongoing season),
`rosterIncomplete` (config present but roster is a partial sample — finish before launch).

For Formula 1 the season object uses `constructors` instead of `teams`, and the
file adds a top-level `pointsRules` block (see that file).

### Duplicate-color disambiguation

A few teams genuinely share a brand color within the same season — e.g. Freiburg
& Heidenheim (both red), Juventus & Udinese (both black/white), and F1 teammates
who share a constructor color. Colors are kept **authentic** rather than altered.
The renderer must disambiguate same-colored lines with a **secondary cue** (e.g.
dashed vs. solid stroke, or a marker shape) so every line stays distinguishable.

---

## Tie-breaker criteria vocabulary

`tieBreakers` is an **ordered** list. The engine applies each in turn until the tie
is broken. `head_to_head_*` criteria are computed on a **mini-table built from only
the tied teams** (the matches they played against each other).

| Key | Meaning |
|---|---|
| `points` | Total league points. |
| `goal_difference` | Overall goals for − against. |
| `goals_scored` | Overall goals for. |
| `away_goals_scored` | Overall goals scored away from home. |
| `head_to_head_points` | Points in matches among the tied teams only. |
| `head_to_head_goal_difference` | Goal difference in matches among the tied teams only. |
| `head_to_head_away_goals` | Away goals in matches among the tied teams only. |
| `count_back` | (F1) Most wins, then 2nds, then 3rds, … down the order. |
| `playoff` | Official rule uses a play-off; **cannot be auto-resolved** — engine skips it for display and continues to the next criterion. |
| `alphabetical` | Final deterministic fallback by name (display only). |

### Pinned per-league order (best-effort — verify against current regulations)

| League | Order |
|---|---|
| **Premier League** | points → GD → goals scored → (play-off) → alphabetical |
| **Bundesliga** | points → GD → goals scored → **H2H points → H2H away goals** → away goals |
| **La Liga** | points → **H2H points → H2H GD** → GD → goals scored |
| **Serie A** | points → **H2H points → H2H GD** → GD → goals scored |
| **Ligue 1** | points → GD → goals scored → **H2H points** → away goals |

> **Key subtlety:** La Liga and Serie A apply head-to-head **before** overall goal
> difference. The Bundesliga and Ligue 1 apply it **after**. The Premier League
> does not use head-to-head at all. Head-to-head among 3+ tied teams is only valid
> once every tied team has played the others the same number of times; otherwise
> the engine falls through to overall GD.

---

## Formula 1 points (`formula-1.json` → `pointsRules`)

Each block applies for seasons in `[fromSeason, toSeason]` (`null` = ongoing):

- **race** — 2010–present: `25-18-15-12-10-8-6-4-2-1` for the top 10.
- **fastestLap** — 2019–2024 only: `+1` point, and only if the driver finished in
  the top 10. (Removed from 2025.)
- **sprint** — 2021: top 3 get `3-2-1`; 2022–present: top 8 get `8-7-6-5-4-3-2-1`.

To support an older era, add another block with its season range and points array.

---

## What's complete vs. TODO

| File | State |
|---|---|
| `premier-league.json` | ✅ Full 2024-25 + 2025-26 rosters & colors |
| `bundesliga.json` | ✅ Full 2024-25 roster (18) & colors |
| `la-liga.json` | ✅ Full 2024-25 roster (20) & colors |
| `serie-a.json` | ✅ Full 2024-25 roster (20) & colors |
| `ligue-1.json` | ✅ Full 2024-25 roster (18) & colors |
| `formula-1.json` | ✅ Points rules + 2024/2025 constructors & colors |
| All tie-breaker orders & colors | ⚠️ Best-effort from public knowledge — **verify against official current regulations** before relying on standings |

> Rosters reflect each season's actual promotions/relegations (e.g. PL 2025-26
> adds Leeds, Burnley, Sunderland; Bundesliga 2024-25 includes St. Pauli &
> Holstein Kiel; Serie A 2024-25 includes Parma, Como, Venezia).

Because validation is **hybrid/warn-only**, partial rosters are safe: unknown team
names trigger a warning and get an auto-assigned color rather than blocking upload.
