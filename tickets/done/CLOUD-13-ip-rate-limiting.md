# CLOUD-13: IP rate limiting

**Status:** done  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — `sha256(ip+salt)` hashing; per-hour window counter in `rate_limit`; 11th
upload/hour → HTTP 429. Never store raw IP.

## Acceptance Criteria
- [x] Test proves the 11th request in an hour is rejected
- [x] Window resets next hour

## Notes
`src/upload/rate-limit.ts`:
- `hashIp(ip, salt)` — sha256 hex; raw IP never stored. `ipFromHeaders()` reads
  x-forwarded-for (first) / x-real-ip.
- `rateLimit({ ipHash, store, now, limit=10, windowMs=1h })` — fixed-window
  counter; `allowed = count <= limit`; returns `{ allowed, count, limit, resetAt }`.
- Storage abstracted via `RateLimitStore`: `InMemoryRateLimitStore` (tests/dev) and
  `createDrizzleRateLimitStore(db)` (atomic `INSERT … ON CONFLICT DO UPDATE
  count = count + 1 RETURNING count` on the `rate_limit` table).

7 unit tests (in-memory, deterministic `now`): hashing, header parsing, first-10
allowed / 11th rejected, next-window reset, per-IP isolation + resetAt. Plus a
DB-gated integration test for the Drizzle upsert — skipped unless `DATABASE_URL`
is set; verified locally against an ephemeral Postgres (counts 1→2→3, new window→1).
66 tests (65 pass, 1 skipped in CI).

The limiter is reusable; it gets wired into the commit route in CLOUD-14
(429 on `!allowed`).
