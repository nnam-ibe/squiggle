# CLOUD-16: Dataset view page (server component)

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — `/[sport]/[league]/[season]` fetches matches, runs the engine
server-side, passes `Standings` + color map to the chart. Shareable permalink;
handles empty/404.

## Acceptance Criteria
- [x] Visiting a seeded permalink renders the dataset view with real data
- [x] Unknown route shows a friendly not-found

## Notes
`src/app/[sport]/[league]/[season]/page.tsx` — async server component
(`dynamic = "force-dynamic"`) that calls `getDatasetStandings` (CLOUD-15). Renders
the design's DatasetView header (back link, sport icon, league title + season pill
+ subtitle, theme toggle) styled with the CLOUD-33 tokens. When the dataset is
missing it renders a friendly not-found (squiggle mark + "Back home").

Chart zone currently holds a **server-rendered final standings table** (position,
color dot + team, P/W/D/L/GD/Pts) so the page shows real data; the interactive
`BumpChart` SVG replaces it in CLOUD-17, and the legend/selection in CLOUD-18.
Icon set extended with soccer/f1/back/chev.

Verified: `next build` registers the dynamic route; served with DATABASE_URL,
`/soccer/premier-league/2025-26` (the seeded season) renders league name, season
pill, and team rows (Arsenal, Manchester City), and `/soccer/premier-league/1999-00`
renders the not-found. 81 tests pass; typecheck + lint clean.
