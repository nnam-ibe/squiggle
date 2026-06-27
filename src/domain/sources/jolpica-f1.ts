/**
 * Jolpica-F1 data source — the Ergast-compatible successor (https://api.jolpi.ca).
 * Fetches a season's race + sprint results and maps them onto our F1 match rows,
 * which the standings engine then turns into drivers'/constructors' tables.
 *
 * The field mapping was proven exact against the accuracy fixture in the CLOUD-38
 * spike (2024: 24 rounds / 479 rows / finish positions / fastest laps all match).
 *
 * Self-contained on purpose (no `@`-alias imports) so it runs both under Vitest and
 * directly via `node scripts/fetch-f1.ts`. Be considerate: Jolpica is volunteer-run
 * with rate limits, so requests are throttled and 429s are retried with backoff.
 */

/** One driver's result in one race — matches the persisted F1 `payload` shape. */
export interface F1MatchRow {
  round: number;
  /** ISO date (YYYY-MM-DD). */
  playedOn: string;
  payload: {
    race?: string;
    driver: string;
    constructor: string;
    /** Finishing position, or `null` for a DNF / non-classified result. */
    finish_position: number | null;
    fastest_lap?: boolean;
    sprint_position?: number | null;
  };
}

/**
 * Jolpica/Ergast constructor names → the branding our season rosters use
 * (`data/leagues/formula-1.json`). Anything not listed is assumed to already match.
 */
export const F1_CONSTRUCTOR_ALIASES: Readonly<Record<string, string>> = {
  "Red Bull": "Red Bull Racing",
  "RB F1 Team": "RB",
  Sauber: "Kick Sauber",
  "Alpine F1 Team": "Alpine",
  "Haas F1 Team": "Haas",
};

export function mapConstructorName(apiName: string): string {
  return F1_CONSTRUCTOR_ALIASES[apiName] ?? apiName;
}

// ── Minimal typings for the bits of the Ergast/Jolpica response we read ──────────
interface ErgastDriver {
  driverId: string;
  givenName: string;
  familyName: string;
}
interface ErgastResult {
  position: string;
  positionText: string;
  Driver: ErgastDriver;
  Constructor: { name: string };
  FastestLap?: { rank?: string };
}
interface ErgastSprintResult {
  position: string;
  positionText: string;
  Driver: ErgastDriver;
}
interface ErgastRace {
  round: string;
  date: string;
  raceName: string;
  Results?: ErgastResult[];
  SprintResults?: ErgastSprintResult[];
}
interface ErgastMRData {
  total: string;
  RaceTable: { Races: ErgastRace[] };
}

export interface FetchF1Options {
  /** Injectable fetch (defaults to global). Tests pass a stub; no network in CI. */
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  /** Delay between paged requests, ms (politeness to a volunteer-run API). */
  throttleMs?: number;
  /**
   * Canonical constructor names for the season (the roster). When provided, any
   * mapped constructor not in this set throws — so a rename drift fails loudly
   * instead of silently producing an uncoloured, mis-grouped entity.
   */
  validConstructors?: ReadonlySet<string>;
}

const DEFAULT_BASE = "https://api.jolpi.ca/ergast/f1";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function driverName(d: ErgastDriver): string {
  return `${d.givenName} ${d.familyName}`;
}

/**
 * A classified finish is a numeric positionText; letters (R/D/E/W/F/N) mark a DNF /
 * non-classified result → `null`. Applies to both race and sprint results.
 */
function classifiedPosition(positionText: string): number | null {
  return /^\d+$/.test(positionText) ? Number(positionText) : null;
}

async function getMRData(url: string, fetchImpl: typeof fetch): Promise<ErgastMRData> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (res.status === 429 && attempt < 4) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Jolpica ${res.status} ${res.statusText} for ${url}`);
    const body = (await res.json()) as { MRData: ErgastMRData };
    return body.MRData;
  }
}

/** Paginate an Ergast list endpoint, merging each race's results across pages. */
async function fetchRaces(
  year: number,
  kind: "results" | "sprint",
  base: string,
  fetchImpl: typeof fetch,
  throttleMs: number,
): Promise<Map<string, ErgastRace>> {
  const byRound = new Map<string, ErgastRace>();
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const mr = await getMRData(`${base}/${year}/${kind}/?limit=${limit}&offset=${offset}&format=json`, fetchImpl);
    for (const race of mr.RaceTable.Races ?? []) {
      const existing = byRound.get(race.round);
      const list = race.Results ?? race.SprintResults ?? [];
      if (existing) {
        (existing.Results ?? existing.SprintResults ?? []).push(...(list as never[]));
      } else {
        byRound.set(race.round, race);
      }
    }
    if (offset + limit >= Number(mr.total)) break;
    if (throttleMs) await sleep(throttleMs);
  }
  return byRound;
}

/**
 * Fetch a full F1 season from Jolpica and map it to our match rows, sorted by round.
 * Throws if a constructor name doesn't resolve to `validConstructors` (when given).
 */
export async function fetchF1Season(year: number, opts: FetchF1Options = {}): Promise<F1MatchRow[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? DEFAULT_BASE;
  const throttleMs = opts.throttleMs ?? 300;

  const sprints = await fetchRaces(year, "sprint", base, fetchImpl, throttleMs);
  // round -> driverId -> sprint finishing position
  const sprintPos = new Map<string, Map<string, number>>();
  for (const [round, race] of sprints) {
    const m = new Map<string, number>();
    for (const s of race.SprintResults ?? []) {
      // Skip sprint DNFs (non-numeric positionText) so they read as "no sprint result".
      const pos = classifiedPosition(s.positionText);
      if (pos !== null) m.set(s.Driver.driverId, pos);
    }
    sprintPos.set(round, m);
  }

  const results = await fetchRaces(year, "results", base, fetchImpl, throttleMs);

  const rows: F1MatchRow[] = [];
  const unknownCtors = new Set<string>();
  for (const round of [...results.keys()].sort((a, b) => Number(a) - Number(b))) {
    const race = results.get(round)!;
    const sp = sprintPos.get(round);
    for (const r of race.Results ?? []) {
      const constructorName = mapConstructorName(r.Constructor.name);
      if (opts.validConstructors && !opts.validConstructors.has(constructorName)) {
        unknownCtors.add(`${r.Constructor.name} → ${constructorName}`);
      }
      const sprintPosition = sp?.has(r.Driver.driverId) ? (sp.get(r.Driver.driverId) ?? null) : null;
      rows.push({
        round: Number(race.round),
        playedOn: race.date,
        payload: {
          race: race.raceName,
          driver: driverName(r.Driver),
          constructor: constructorName,
          finish_position: classifiedPosition(r.positionText),
          fastest_lap: r.FastestLap?.rank === "1",
          sprint_position: sprintPosition,
        },
      });
    }
  }

  if (unknownCtors.size) {
    throw new Error(
      `Unrecognised F1 constructor(s) for ${year} — add to F1_CONSTRUCTOR_ALIASES or the roster:\n  ` +
        [...unknownCtors].join("\n  "),
    );
  }
  return rows;
}
