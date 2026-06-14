# CLOUD-2: Set up Postgres + Drizzle + migrations

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 0 — Provision Postgres (Neon/Supabase), add Drizzle, create the `datasets`,
`matches`, `rate_limit` tables and the migration workflow.

## Acceptance Criteria
- [x] Migrations run against a local DB; smoke query succeeds
- [ ] Migrations run against a hosted DB — pending a provisioned `DATABASE_URL`
      (same command: `npm run db:migrate`)

## Notes
Implemented:
- `src/db/schema.ts` — Drizzle schema for `datasets` (unique on league_id+season),
  `matches` (FK → datasets ON DELETE CASCADE, jsonb payload, index on dataset+round),
  `rate_limit` (composite PK). Plus inferred `Dataset`/`Match` types.
- `src/db/client.ts` — lazy `getDb()` (postgres.js driver, `prepare:false` for
  pooler compatibility); requires `DATABASE_URL` at call time, not import.
- `drizzle.config.ts` + scripts `db:generate` / `db:migrate` / `db:push`.
- `drizzle/0000_init.sql` (generated, committed) + `.env.example`.

Verified locally end-to-end against an **ephemeral Postgres cluster** (initdb →
`drizzle-kit migrate` → smoke): all 3 tables created, insert/select of a dataset +
match (jsonb + FK) succeeded, and the unique (league, season) index correctly
rejected a duplicate.

Remaining (ops, not code): provision a hosted Postgres (Neon/Supabase), set
`DATABASE_URL`, and run `npm run db:migrate`. Driver is postgres.js; if deploying
to Neon serverless/edge later, swapping to `@neondatabase/serverless` is a small
change in `client.ts`.
