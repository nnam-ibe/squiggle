# CLOUD-2: Set up Postgres + Drizzle + migrations

**Status:** open  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 0 — Provision Postgres (Neon/Supabase), add Drizzle, create the `datasets`,
`matches`, `rate_limit` tables and the migration workflow.

## Acceptance Criteria
- [ ] Migrations run against a local + hosted DB
- [ ] A smoke query succeeds from the app

## Notes
Depends on CLOUD-1. Schema defined in TECHNICAL_DESIGN.md §4.
