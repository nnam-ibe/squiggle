import { and, asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { datasets, matches } from "@/db/schema";
import { getColor, getLeague, getSeasonRoster } from "@/config/leagues";
import { getDb } from "@/db/client";
import { createSoccerAdapter } from "@/domain/sports/soccer";
import { createF1Adapter } from "@/domain/sports/f1";
import { computeStandings } from "@/domain/standings";
import type { EntityType, NormalizedResult, Standings } from "@/domain/types";

type Db = PostgresJsDatabase<typeof schema>;

/** Which F1 standings to compute/show. Soccer datasets ignore this. */
export type EntityMode = "drivers" | "constructors";

interface SoccerPayload {
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
}

/** Persisted F1 match row (one driver per race). Mirrors the F1 CSV columns. */
interface F1Payload {
  race?: string;
  driver: string;
  constructor: string;
  finish_position: number | null;
  fastest_lap?: boolean;
  sprint_position?: number | null;
}

export interface DatasetStandings {
  sport: string;
  league: string;
  season: string;
  isComplete: boolean;
  roundsPresent: number;
  sourceFilename: string | null;
  updatedAt: string;
  entityType: string;
  /** Active F1 entity mode (`null` for soccer). */
  entity: EntityMode | null;
  /** F1 entity modes the league supports (`null` for soccer) — drives the UI toggle. */
  entities: EntityMode[] | null;
  matches: { round: number; playedOn: string; payload: unknown }[];
  standings: Standings;
  /** entity → brand color, from config (frontend auto-colors anything absent). */
  colors: Record<string, string>;
  /** entity → short code, from config roster. */
  shorts: Record<string, string>;
}

export interface DatasetQuery {
  sport: string;
  league: string;
  season: string;
  /** F1 only: `drivers` (default) or `constructors`. Ignored for soccer. */
  entity?: EntityMode;
}

/**
 * Load a persisted dataset by (sport, league, season), recompute its standings,
 * and return matches + standings + colors. Returns null when the league/sport is
 * unknown or no dataset exists (→ 404). The DB is only touched once the config
 * check passes, so unknown-league lookups need no database.
 */
export async function getDatasetStandings(
  { sport, league, season, entity }: DatasetQuery,
  dbArg?: Db,
): Promise<DatasetStandings | null> {
  const cfg = getLeague(league);
  if (!cfg || cfg.sport !== sport) return null;

  const db = dbArg ?? getDb();
  const [ds] = await db
    .select()
    .from(datasets)
    .where(and(eq(datasets.leagueId, league), eq(datasets.season, season)))
    .limit(1);
  if (!ds) return null;

  const rows = await db
    .select()
    .from(matches)
    .where(eq(matches.datasetId, ds.id))
    .orderBy(asc(matches.round), asc(matches.playedOn));

  const base = {
    sport: cfg.sport,
    league,
    season,
    isComplete: ds.isComplete,
    roundsPresent: ds.roundsPresent,
    sourceFilename: ds.sourceFilename,
    updatedAt: ds.createdAt instanceof Date ? ds.createdAt.toISOString() : String(ds.createdAt),
    matches: rows.map((r) => ({ round: r.round, playedOn: r.playedOn, payload: r.payload })),
  };

  if (cfg.sport === "soccer") {
    const results: NormalizedResult[] = rows.map((r) => {
      const p = r.payload as SoccerPayload;
      return {
        round: r.round,
        playedOn: r.playedOn,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        homeGoals: p.home_goals,
        awayGoals: p.away_goals,
      };
    });

    const standings = computeStandings({
      results,
      entityType: "team",
      tieBreakers: cfg.tieBreakers,
      adapter: createSoccerAdapter(cfg.format),
    });

    const colors: Record<string, string> = {};
    for (const s of standings.rounds.at(-1)?.standings ?? []) {
      const c = getColor(league, season, s.entity);
      if (c) colors[s.entity] = c;
    }
    const shorts: Record<string, string> = {};
    for (const e of getSeasonRoster(league, season) ?? []) shorts[e.name] = e.short;

    return { ...base, entityType: "team", entity: null, entities: null, standings, colors, shorts };
  }

  // motorsport (F1) — switch the computed standings by the requested entity mode.
  const mode: EntityMode = entity === "constructors" ? "constructors" : "drivers";
  const entityType: EntityType = mode === "constructors" ? "constructor" : "driver";

  const results: NormalizedResult[] = rows.map((r) => {
    const p = r.payload as F1Payload;
    return {
      round: r.round,
      playedOn: r.playedOn,
      race: p.race,
      driver: p.driver,
      constructorName: p.constructor,
      finishPosition: p.finish_position ?? null,
      fastestLap: !!p.fastest_lap,
      sprintPosition: p.sprint_position ?? null,
    };
  });

  const standings = computeStandings({
    results,
    entityType,
    tieBreakers: cfg.tieBreakers,
    adapter: createF1Adapter(season, cfg.pointsRules),
  });

  const final = standings.rounds.at(-1)?.standings ?? [];
  const colors: Record<string, string> = {};
  const shorts: Record<string, string> = {};

  if (mode === "constructors") {
    for (const s of final) {
      const c = getColor(league, season, s.entity);
      if (c) colors[s.entity] = c;
    }
    for (const e of getSeasonRoster(league, season) ?? []) shorts[e.name] = e.short;
  } else {
    // Drivers aren't in the config roster — inherit each driver's constructor color
    // (teammates then share a color, which the chart disambiguates with a dashed line).
    const driverTeam = new Map<string, string>();
    for (const r of results) {
      if (r.driver && r.constructorName) driverTeam.set(r.driver, r.constructorName);
    }
    for (const s of final) {
      const team = driverTeam.get(s.entity);
      const c = team ? getColor(league, season, team) : undefined;
      if (c) colors[s.entity] = c;
    }
  }

  return { ...base, entityType, entity: mode, entities: cfg.entities, standings, colors, shorts };
}
