# CLOUD-13: IP rate limiting

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-14  
**Updated:** 2026-06-14  

## Description
Epic 2 — `sha256(ip+salt)` hashing; per-hour window counter in `rate_limit`; 11th
upload/hour → HTTP 429. Never store raw IP.

## Acceptance Criteria
- [ ] Test proves the 11th request in an hour is rejected
- [ ] Window resets next hour

## Notes
Depends on CLOUD-2.
