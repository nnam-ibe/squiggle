import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimit as rateLimitTable } from "@/db/schema";

export const RATE_LIMIT = 10; // uploads per window per IP
export const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Hash an IP with a salt; the raw IP is never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${ip}|${salt}`).digest("hex");
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function ipFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Pluggable counter store keyed by (ipHash, window start), returns the new count. */
export interface RateLimitStore {
  increment(ipHash: string, windowStartMs: number): Promise<number>;
}

/** In-memory store — for tests and single-process dev. */
export class InMemoryRateLimitStore implements RateLimitStore {
  private counts = new Map<string, number>();
  async increment(ipHash: string, windowStartMs: number): Promise<number> {
    const key = `${ipHash}|${windowStartMs}`;
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }
}

/** Postgres-backed store: atomic upsert-increment of the rate_limit row. */
export function createDrizzleRateLimitStore(db = getDb()): RateLimitStore {
  return {
    async increment(ipHash, windowStartMs) {
      const rows = await db
        .insert(rateLimitTable)
        .values({ ipHash, windowStart: new Date(windowStartMs), count: 1 })
        .onConflictDoUpdate({
          target: [rateLimitTable.ipHash, rateLimitTable.windowStart],
          set: { count: sql`${rateLimitTable.count} + 1` },
        })
        .returning({ count: rateLimitTable.count });
      return rows[0].count;
    },
  };
}

export interface RateLimitInput {
  ipHash: string;
  store: RateLimitStore;
  now?: number;
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  /** Epoch ms when the current window ends and the count resets. */
  resetAt: number;
}

/**
 * Count this request against the IP's current fixed window and report whether it
 * is allowed (count <= limit). Rejected requests still increment.
 */
export async function rateLimit({
  ipHash,
  store,
  now = Date.now(),
  limit = RATE_LIMIT,
  windowMs = WINDOW_MS,
}: RateLimitInput): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const count = await store.increment(ipHash, windowStart);
  return { allowed: count <= limit, count, limit, resetAt: windowStart + windowMs };
}
