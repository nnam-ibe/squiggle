/**
 * Normalise a soccer season to the canonical `YYYY-YY` (e.g. "1998/1999" → "1998-99"),
 * or null if it isn't a valid consecutive-year season. Lets uploads target any season,
 * not just the ones pre-listed in config.
 */
export function normalizeSeason(raw: string): string | null {
  const t = raw.trim().replace(/\//g, "-");
  const m = /^(\d{4})-(\d{2}|\d{4})$/.exec(t);
  if (!m) return null;
  const start = Number(m[1]);
  if (start < 1880 || start > 2100) return null;
  const endTwo = m[2].length === 4 ? m[2].slice(2) : m[2];
  const expected = String((start + 1) % 100).padStart(2, "0");
  return endTwo === expected ? `${start}-${endTwo}` : null;
}
