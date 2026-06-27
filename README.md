# Squiggle

A [Next.js](https://nextjs.org) app for uploading league/season results and
viewing them as animated standings "bump charts." Data is stored in Postgres
via [Drizzle](https://orm.drizzle.team).

## Getting Started

Install dependencies and configure the environment:

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and IP_HASH_SALT
```

Apply the database schema, then run the dev server:

```bash
npm run db:migrate     # or: npm run db:migrate:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment variables

| Variable       | Required | Description                                                        |
| -------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | yes      | Postgres connection string. Append `?sslmode=require` for managed providers (Supabase/Neon). |
| `IP_HASH_SALT` | yes      | Random secret used to hash uploader IPs for rate limiting.         |

### Seeding demo data

`npm run seed` loads the verified launch datasets so the homepage isn't empty.
It runs against whatever `DATABASE_URL` points to (including production).

## Deployment (Vercel + Postgres)

The app runs as a standard Node.js Next.js server and deploys to Vercel with no
adapter. Migrations are applied automatically on every deploy: Vercel runs the
`vercel-build` script (`node scripts/migrate.ts && next build`), which brings
the schema up to date before building.

**One-time setup:**

1. **Provision Postgres.** Create a database (Supabase, Neon, or Vercel
   Postgres). Copy its connection string — use the **pooled/transaction** URL
   with `?sslmode=require` (the client uses `prepare: false` so it is
   pooler-safe).
2. **Import the repo into Vercel** ([vercel.com/new](https://vercel.com/new)).
   Vercel auto-detects Next.js; no build settings need changing.
3. **Set environment variables** in the Vercel project (Production, and Preview
   if you use it):
   - `DATABASE_URL` — the connection string from step 1.
   - `IP_HASH_SALT` — any long random string (e.g. `openssl rand -hex 32`).
4. **Deploy.** The `vercel-build` step runs migrations, then builds. After the
   first deploy, run `npm run seed` once (locally, with the production
   `DATABASE_URL`) to populate the launch datasets.

After deploying: the production URL serves the app, uploads persist to Postgres,
and dataset permalinks (`/<sport>/<league>/<season>`) resolve from the database.
