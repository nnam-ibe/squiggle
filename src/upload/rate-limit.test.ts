import { describe, it, expect } from "vitest";
import {
  hashIp,
  ipFromHeaders,
  rateLimit,
  InMemoryRateLimitStore,
  RATE_LIMIT,
  WINDOW_MS,
} from "./rate-limit";

describe("hashIp", () => {
  it("is deterministic and never contains the raw IP", () => {
    const h = hashIp("203.0.113.7", "salt");
    expect(h).toBe(hashIp("203.0.113.7", "salt"));
    expect(h).not.toContain("203.0.113.7");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
  it("varies by IP and by salt", () => {
    expect(hashIp("1.1.1.1", "s")).not.toBe(hashIp("1.1.1.2", "s"));
    expect(hashIp("1.1.1.1", "s1")).not.toBe(hashIp("1.1.1.1", "s2"));
  });
});

describe("ipFromHeaders", () => {
  it("takes the first x-forwarded-for entry", () => {
    expect(ipFromHeaders(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(ipFromHeaders(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(ipFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("rateLimit (fixed window)", () => {
  const ipHash = hashIp("203.0.113.7", "salt");

  it("allows the first 10 and rejects the 11th within the hour", async () => {
    const store = new InMemoryRateLimitStore();
    const now = 1_700_000_000_000;
    const outcomes = [];
    for (let i = 0; i < 11; i++) {
      outcomes.push(await rateLimit({ ipHash, store, now }));
    }
    expect(outcomes.slice(0, RATE_LIMIT).every((o) => o.allowed)).toBe(true);
    expect(outcomes[RATE_LIMIT].allowed).toBe(false); // the 11th
    expect(outcomes[RATE_LIMIT].count).toBe(11);
  });

  it("resets in the next window", async () => {
    const store = new InMemoryRateLimitStore();
    const now = 1_700_000_000_000;
    for (let i = 0; i < 11; i++) await rateLimit({ ipHash, store, now });
    const next = await rateLimit({ ipHash, store, now: now + WINDOW_MS });
    expect(next.allowed).toBe(true);
    expect(next.count).toBe(1);
  });

  it("tracks each IP independently and reports resetAt", async () => {
    const store = new InMemoryRateLimitStore();
    const now = 1_700_000_000_000;
    const a = await rateLimit({ ipHash: "a", store, now });
    const b = await rateLimit({ ipHash: "b", store, now });
    expect(a.count).toBe(1);
    expect(b.count).toBe(1);
    expect(a.resetAt).toBe(Math.floor(now / WINDOW_MS) * WINDOW_MS + WINDOW_MS);
  });
});
