/**
 * Convert football-data.co.uk soccer CSVs into the Squiggle results template.
 *
 * That feed has no round/matchday column and uses short team names, so this:
 *  - maps columns (Date, HomeTeam, AwayTeam, FTHG, FTAG → template),
 *  - normalizes dates to ISO,
 *  - aliases short team names to canonical roster names,
 *  - derives a round per match by date-ordered per-team game count
 *    (round = "the Nth game each team has played").
 */

export interface TemplateRow {
  round: number;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
}

export interface ConvertResult {
  rows: TemplateRow[];
  teams: string[];
  rounds: number;
  skipped: number; // rows dropped for missing/invalid essential fields
}

/** Common football-data.co.uk short names → canonical roster names. */
export const DEFAULT_PL_ALIASES: Record<string, string> = {
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  Newcastle: "Newcastle United",
  "Nott'm Forest": "Nottingham Forest",
  Tottenham: "Tottenham Hotspur",
  "West Ham": "West Ham United",
  Wolves: "Wolverhampton Wanderers",
  Leeds: "Leeds United",
  Ipswich: "Ipswich Town",
  Leicester: "Leicester City",
};

/** football-data.co.uk La Liga abbreviations → canonical roster names. */
export const DEFAULT_LALIGA_ALIASES: Record<string, string> = {
  "Ath Bilbao": "Athletic Club",
  "Ath Madrid": "Atletico Madrid",
  Betis: "Real Betis",
  Celta: "Celta Vigo",
  Espanol: "Espanyol",
  Sociedad: "Real Sociedad",
  Vallecano: "Rayo Vallecano",
  Oviedo: "Real Oviedo",
};

/** Alias map per league id, for the converter CLI to pick by `--league`. */
export const ALIASES_BY_LEAGUE: Record<string, Record<string, string>> = {
  "premier-league": DEFAULT_PL_ALIASES,
  "la-liga": DEFAULT_LALIGA_ALIASES,
};

/** Normalize a date to ISO YYYY-MM-DD (passes ISO through; converts dd/mm/yy[yy]). */
export function toIsoDate(value: string): string {
  const t = (value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
  if (m) {
    const [, d, mo, yRaw] = m;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${mo}-${d}`;
  }
  return t; // leave as-is; downstream validation will flag it
}

/** Case-insensitive header lookup. */
function field(row: Record<string, string>, key: string): string {
  const hit = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
  return hit ? row[hit] : "";
}

interface Parsed {
  i: number;
  date: string;
  home: string;
  away: string;
  hg: number;
  ag: number;
  round?: number;
}

export function convertFootballData(
  rows: Record<string, string>[],
  opts: { aliases?: Record<string, string> } = {},
): ConvertResult {
  const aliases = opts.aliases ?? DEFAULT_PL_ALIASES;
  const norm = (n: string) => {
    const name = (n ?? "").trim();
    return aliases[name] ?? name;
  };

  const parsed: Parsed[] = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    const home = norm(field(r, "HomeTeam"));
    const away = norm(field(r, "AwayTeam"));
    const date = toIsoDate(field(r, "Date"));
    const hg = Number(field(r, "FTHG"));
    const ag = Number(field(r, "FTAG"));
    if (!home || !away || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hg) || !Number.isInteger(ag)) {
      skipped++;
      return;
    }
    parsed.push({ i, date, home, away, hg, ag });
  });

  // Derive rounds: process in date order (stable on ties), round = max games
  // either team has already played + 1.
  const ordered = [...parsed].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.i - b.i,
  );
  const played = new Map<string, number>();
  for (const m of ordered) {
    m.round = Math.max(played.get(m.home) ?? 0, played.get(m.away) ?? 0) + 1;
    played.set(m.home, (played.get(m.home) ?? 0) + 1);
    played.set(m.away, (played.get(m.away) ?? 0) + 1);
  }

  const out = [...ordered].sort((a, b) => a.round! - b.round! || (a.date < b.date ? -1 : 1));
  const templateRows: TemplateRow[] = out.map((m) => ({
    round: m.round!,
    date: m.date,
    home_team: m.home,
    away_team: m.away,
    home_goals: m.hg,
    away_goals: m.ag,
  }));

  const teams = [...new Set(parsed.flatMap((m) => [m.home, m.away]))].sort();
  const rounds = out.length ? Math.max(...out.map((m) => m.round!)) : 0;
  return { rows: templateRows, teams, rounds, skipped };
}

/** Serialize template rows to a CSV string (header + rows). */
export function toTemplateCsv(rows: TemplateRow[]): string {
  const header = "round,date,home_team,away_team,home_goals,away_goals";
  const lines = rows.map(
    (r) => `${r.round},${r.date},${r.home_team},${r.away_team},${r.home_goals},${r.away_goals}`,
  );
  return [header, ...lines].join("\n") + "\n";
}
