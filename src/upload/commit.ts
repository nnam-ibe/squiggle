import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { validateSoccerUpload, type SoccerUploadInput, type ValidationIssue } from "./validate";
import { getLeague } from "@/config/leagues";
import * as schema from "@/db/schema";
import { datasets, matches } from "@/db/schema";

type Db = PostgresJsDatabase<typeof schema>;

export interface CommitInput extends SoccerUploadInput {
  db: Db;
  sourceFilename?: string;
  uploaderIpHash?: string;
}

export interface CommitResult {
  ok: boolean;
  status: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  datasetId?: string;
  permalink?: string;
  roundsPresent?: number;
  isComplete?: boolean;
}

/**
 * Re-validate a soccer upload and, when valid, persist it: in one transaction,
 * delete any existing dataset for (league, season) — matches cascade — and insert
 * the new dataset + its matches. Returns the dataset's permalink.
 */
export async function commitSoccerUpload(input: CommitInput): Promise<CommitResult> {
  const outcome = validateSoccerUpload(input);
  if (!outcome.ok) {
    return { ok: false, status: 400, errors: outcome.errors, warnings: outcome.warnings };
  }
  const league = getLeague(input.leagueId);
  if (!league || league.sport !== "soccer") {
    return {
      ok: false,
      status: 400,
      errors: [{ code: "wrong_sport", message: `League "${input.leagueId}" is not a soccer league` }],
      warnings: [],
    };
  }

  const datasetId = await input.db.transaction(async (tx) => {
    await tx
      .delete(datasets)
      .where(and(eq(datasets.leagueId, input.leagueId), eq(datasets.season, input.season)));

    const [row] = await tx
      .insert(datasets)
      .values({
        sport: league.sport,
        leagueId: input.leagueId,
        season: input.season,
        sourceFilename: input.sourceFilename ?? null,
        rowCount: outcome.rowCount,
        roundsPresent: outcome.roundsPresent,
        isComplete: outcome.isComplete,
        uploaderIpHash: input.uploaderIpHash ?? null,
      })
      .returning({ id: datasets.id });

    if (outcome.results.length) {
      await tx.insert(matches).values(
        outcome.results.map((r) => ({
          datasetId: row.id,
          round: r.round,
          playedOn: r.playedOn,
          payload: {
            home_team: r.homeTeam,
            away_team: r.awayTeam,
            home_goals: r.homeGoals,
            away_goals: r.awayGoals,
          },
        })),
      );
    }
    return row.id;
  });

  return {
    ok: true,
    status: 200,
    errors: [],
    warnings: outcome.warnings,
    datasetId,
    permalink: `/${league.sport}/${input.leagueId}/${encodeURIComponent(input.season)}`,
    roundsPresent: outcome.roundsPresent,
    isComplete: outcome.isComplete,
  };
}
