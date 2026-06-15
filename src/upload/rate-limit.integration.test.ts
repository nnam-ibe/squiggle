import { describe, it, expect } from "vitest";
import { createDrizzleRateLimitStore } from "./rate-limit";

// Runs only when DATABASE_URL is set (e.g. an ephemeral Postgres locally).
// Skipped in normal `npm test` / CI so no DB is required there.
describe.skipIf(!process.env.DATABASE_URL)("DrizzleRateLimitStore (integration)", () => {
  it("atomically increments per (ipHash, window) and isolates windows", async () => {
    const store = createDrizzleRateLimitStore();
    const ip = `test-${Date.now()}-${Math.random()}`;
    const w = 1_700_000_000_000;

    expect(await store.increment(ip, w)).toBe(1);
    expect(await store.increment(ip, w)).toBe(2);
    expect(await store.increment(ip, w)).toBe(3);
    // a different window starts fresh
    expect(await store.increment(ip, w + 3_600_000)).toBe(1);
  });
});
