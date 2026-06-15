import { and, asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { datasets, matches } from "@/db/schema";
import { getColor, getLeague } from "@/config/leagues";
import { getDb } from "@/db/client";
import { createSoccerAdapter } from "@/domain/sports/soccer";
import { computeStandings } from "@/domain/standings";
import type { NormalizedResult, Standings } from "@/domain/types";

type Db = PostgresJsDatabase<typeof schema>;

interface SoccerPayload {
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
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
  matches: { round: number; playedOn: string; payload: unknown }[];
  standings: Standings;
  /** entity → brand color, from config (frontend auto-colors anything absent). */
  colors: Record<string, string>;
}

export interface DatasetQuery {
  sport: string;
  league: string;
  season: string;
}

/**
 * Load a persisted dataset by (sport, league, season), recompute its standings,
 * and return matches + standings + colors. Returns null when the league/sport is
 * unknown or no dataset exists (→ 404). The DB is only touched once the config
 * check passes, so unknown-league lookups need no database.
 */
export async function getDatasetStandings(
  { sport, league, season }: DatasetQuery,
  dbArg?: Db,
): Promise<DatasetStandings | null> {
  const cfg = getLeague(league);
  if (!cfg || cfg.sport !== sport) return null;
  if (cfg.sport !== "soccer") return null; // F1 read deferred to CLOUD-23

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

  const adapter = createSoccerAdapter(cfg.format);
  const standings = computeStandings({
    results,
    entityType: "team",
    tieBreakers: cfg.tieBreakers,
    adapter,
  });

  const colors: Record<string, string> = {};
  for (const s of standings.rounds.at(-1)?.standings ?? []) {
    const c = getColor(league, season, s.entity);
    if (c) colors[s.entity] = c;
  }

  return {
    sport: cfg.sport,
    league,
    season,
    isComplete: ds.isComplete,
    roundsPresent: ds.roundsPresent,
    sourceFilename: ds.sourceFilename,
    updatedAt: ds.createdAt instanceof Date ? ds.createdAt.toISOString() : String(ds.createdAt),
    entityType: "team",
    matches: rows.map((r) => ({ round: r.round, playedOn: r.playedOn, payload: r.payload })),
    standings,
    colors,
  };
}
