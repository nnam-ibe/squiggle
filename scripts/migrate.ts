/**
 * Apply Drizzle migrations against DATABASE_URL (CLOUD-30).
 *
 *   node scripts/migrate.ts                       # uses process.env.DATABASE_URL
 *   node --env-file=.env scripts/migrate.ts       # load DATABASE_URL from .env
 *
 * This is the deploy-time migration path: `vercel-build` runs it before
 * `next build`, so every production deploy brings the schema up to date. It uses
 * the runtime `drizzle-orm` + `postgres` dependencies (not the drizzle-kit
 * devDependency) and reads migrations from ./drizzle, so it works in any
 * environment that injects DATABASE_URL — including Vercel's build container.
 *
 * SSL is driven by the connection string (e.g. `?sslmode=require` for
 * Supabase/Neon), so the same script works locally and in production.
 */
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (e.g. node --env-file=.env scripts/migrate.ts)");
    process.exit(1);
  }

  // prepare:false keeps us pooler-safe (Supabase/PgBouncer transaction mode);
  // max:1 is plenty for a one-shot migration run.
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("✓ migrations applied");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
