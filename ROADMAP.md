# Roadmap — Squiggle (v1)

High-level overview of the build, grouped into epics. **This is a static
overview — live ticket status lives in `tickets/`** (`open/`, `in-progress/`,
`done/`), one markdown file per ticket. See `TECHNICAL_DESIGN.md` for the
engineering detail behind each item.

## Milestones
- **M1 — Soccer MVP (shippable):** Epics 0 → 1 → 2 → 3.
- **M2 — Multi-sport:** Epic 4.
- **M3 — Launch:** Epics 5 → 6.

## Epics & tickets

### EPIC 0 — Project scaffold & infrastructure
- CLOUD-1 · Initialize Next.js + TypeScript + Tailwind
- CLOUD-2 · Set up Postgres + Drizzle + migrations
- CLOUD-3 · Config loader with Zod validation
- CLOUD-4 · CI pipeline + Vitest harness

### EPIC 1 — Standings engine (soccer)
- CLOUD-5 · Domain types
- CLOUD-6 · Soccer adapter — accumulate stats
- CLOUD-7 · Config-driven tie-breaker resolver
- CLOUD-8 · Snapshot-by-date engine
- CLOUD-9 · Engine accuracy test vs. real season

### EPIC 2 — Upload pipeline (soccer)
- CLOUD-10 · CSV parse + soccer row normalization
- CLOUD-11 · Validation rules (errors vs. warnings)
- CLOUD-12 · POST /api/datasets/validate (preview, no save)
- CLOUD-13 · IP rate limiting
- CLOUD-14 · POST /api/datasets commit + replace-on-reupload

### EPIC 3 — Dataset view + bump chart (soccer)
- CLOUD-15 · GET /api/datasets/:sport/:league/:season
- CLOUD-16 · Dataset view page (server component)
- CLOUD-17 · BumpChart component (static interactive)
- CLOUD-18 · Tap-to-highlight + tooltips
- CLOUD-19 · Duplicate-color disambiguation
- CLOUD-20 · Mobile responsiveness pass

### EPIC 4 — Formula 1 support
- CLOUD-21 · F1 adapter — points rules + parsing
- CLOUD-22 · F1 drivers vs. constructors standings
- CLOUD-23 · F1 entity toggle on dataset view
- CLOUD-24 · F1 driver line styling
- CLOUD-25 · F1 accuracy + parser tests

### EPIC 5 — Catalog homepage + polish
- CLOUD-26 · GET /api/catalog
- CLOUD-27 · Homepage cascading selectors
- CLOUD-28 · Upload wizard UI
- CLOUD-29 · Error/empty/loading states + a11y pass

### EPIC 6 — Deploy & launch
- CLOUD-30 · Vercel + Postgres deployment
- CLOUD-31 · Seed validated launch datasets
- CLOUD-32 · Cross-device smoke test

## Pre-build verification (from `data/README.md` risks)
- [ ] Confirm exact La Liga & Serie A head-to-head regulations (feeds CLOUD-7 tests).
- [ ] Verify rosters/brand colors and per-league tie-breaker orders before seeding (CLOUD-31).
