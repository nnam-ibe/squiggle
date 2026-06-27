# CLOUD-30: Vercel + Postgres deployment

**Status:** in-progress  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-27  

## Description
Epic 6 — Configure hosting, env vars (DB URL, IP salt), run migrations on deploy.

## Acceptance Criteria
- [ ] Production URL serves the app
- [ ] Uploads persist
- [ ] Permalinks work

## Notes
Depends on CLOUD-14, CLOUD-16.

## Progress
Repo-side enablement done (this branch):
- `scripts/migrate.ts` — runtime Drizzle migrator (no drizzle-kit dep), driven by
  `DATABASE_URL`; SSL inferred from the connection string. Verified against the DB.
- `package.json` — `vercel-build` (`node scripts/migrate.ts && next build`) so Vercel
  applies migrations on every deploy; plus `db:migrate:deploy`.
- `README.md` — Vercel + Postgres deployment guide and env-var reference.

Remaining (manual, needs Vercel account + Postgres provider) — keeps ticket open until
the live deploy is verified:
- Provision Postgres; import repo into Vercel; set `DATABASE_URL` + `IP_HASH_SALT`.
- Deploy (migrations run via `vercel-build`); run `npm run seed` once against prod.
- Then confirm acceptance criteria on the live URL and move to `done/`.
