# CLOUD-16: Dataset view page (server component)

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 3 — `/[sport]/[league]/[season]` fetches matches, runs the engine
server-side, passes `Standings` + color map to the chart. Shareable permalink;
handles empty/404.

## Acceptance Criteria
- [ ] Visiting a seeded permalink renders the chart
- [ ] Unknown route shows a friendly not-found

## Notes
Depends on CLOUD-15.
