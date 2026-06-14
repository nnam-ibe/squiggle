import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cached: PostgresJsDatabase<typeof schema> | undefined;

/** Lazily-created Drizzle client. Requires DATABASE_URL at call time (not import). */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // prepare:false works across poolers (e.g. Supabase/PgBouncer transaction mode).
    const client = postgres(url, { prepare: false });
    cached = drizzle(client, { schema });
  }
  return cached;
}
