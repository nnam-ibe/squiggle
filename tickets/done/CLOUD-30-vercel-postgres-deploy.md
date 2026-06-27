# CLOUD-30: Vercel + Postgres deployment

**Status:** done  
**Priority:** high  
**Created:** 2026-06-14  
**Updated:** 2026-06-27  

## Description
Epic 6 — Configure hosting, env vars (DB URL, IP salt), run migrations on deploy.

## Acceptance Criteria
- [x] Production URL serves the app — `squiggle-taupe.vercel.app` (HTTP 200)
- [x] Uploads persist — Postgres connected/writable; verified via prod seed + live reads
- [x] Permalinks work — `/soccer/premier-league/2025-26` and `/motorsport/formula-1/2024` render seeded standings

## Notes
Depends on CLOUD-14, CLOUD-16.

## Progress
Repo-side enablement done (this branch):
- `scripts/migrate.ts` — runtime Drizzle migrator (no drizzle-kit dep), driven by
  `DATABASE_URL`; SSL inferred from the connection string. Verified against the DB.
- `package.json` — `vercel-build` (`node scripts/migrate.ts && next build`) so Vercel
  applies migrations on every deploy; plus `db:migrate:deploy`.
- `README.md` — Vercel + Postgres deployment guide and env-var reference.

Live deploy completed and verified:
- Project `squiggle` on Vercel (Next.js, Node 24.x) with `DATABASE_URL` + `IP_HASH_SALT` set;
  migrations apply on deploy via `vercel-build`.
- Production DB seeded with launch datasets (`scripts/seed-datasets.ts` against prod creds).
- Homepage lists both datasets; permalinks render real standings at `squiggle-taupe.vercel.app`.
