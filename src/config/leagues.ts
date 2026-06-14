import fs from "node:fs";
import path from "node:path";
import {
  leagueConfigSchema,
  type LeagueConfig,
  type EntityConfig,
  type MotorsportLeagueConfig,
  type TieBreaker,
} from "./schema";

const LEAGUES_DIR = path.join(process.cwd(), "data", "leagues");

/** Loads + validates every data/leagues/*.json once, throwing on malformed config. */
function loadLeagues(): Map<string, LeagueConfig> {
  const map = new Map<string, LeagueConfig>();
  const files = fs
    .readdirSync(LEAGUES_DIR)
    .filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(LEAGUES_DIR, file), "utf8"),
    );
    const parsed = leagueConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid league config ${file}: ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    if (map.has(parsed.data.id)) {
      throw new Error(`Duplicate league id "${parsed.data.id}" in ${file}`);
    }
    map.set(parsed.data.id, parsed.data);
  }
  return map;
}

let cache: Map<string, LeagueConfig> | null = null;

function leagues(): Map<string, LeagueConfig> {
  if (!cache) cache = loadLeagues();
  return cache;
}

export function getAllLeagues(): LeagueConfig[] {
  return [...leagues().values()];
}

export function getLeague(id: string): LeagueConfig | undefined {
  return leagues().get(id);
}

/** The configured entity list (teams or constructors) for a league season. */
export function getSeasonRoster(
  leagueId: string,
  season: string,
): EntityConfig[] | undefined {
  const league = getLeague(leagueId);
  if (!league) return undefined;
  if (league.sport === "soccer") {
    return league.seasons[season]?.teams;
  }
  return league.seasons[season]?.constructors;
}

/** Brand color for a named entity in a season, or undefined if unknown (caller auto-colors). */
export function getColor(
  leagueId: string,
  season: string,
  entityName: string,
): string | undefined {
  const roster = getSeasonRoster(leagueId, season);
  return roster?.find((e) => e.name === entityName)?.color;
}

export function getTieBreakers(leagueId: string): TieBreaker[] | undefined {
  return getLeague(leagueId)?.tieBreakers;
}

export function getF1PointsRules(): MotorsportLeagueConfig["pointsRules"] | undefined {
  const f1 = getAllLeagues().find(
    (l): l is MotorsportLeagueConfig => l.sport === "motorsport",
  );
  return f1?.pointsRules;
}

/** Test-only: clear the module cache so a fresh load picks up changes. */
export function __resetLeagueCache() {
  cache = null;
}
