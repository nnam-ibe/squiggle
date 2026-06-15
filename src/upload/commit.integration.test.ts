import { describe, it, expect, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { commitSoccerUpload } from "./commit";
import { getDb } from "@/db/client";
import { datasets, matches } from "@/db/schema";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";

// Runs only with DATABASE_URL set (ephemeral Postgres locally); skipped in CI.
describe.skipIf(!process.env.DATABASE_URL)("commitSoccerUpload (integration)", () => {
  const db = process.env.DATABASE_URL ? getDb() : (null as never);
  const leagueId = "premier-league";
  const season = `itest-${Date.now()}`;

  afterAll(async () => {
    if (process.env.DATABASE_URL) {
      await db.delete(datasets).where(and(eq(datasets.leagueId, leagueId), eq(datasets.season, season)));
    }
  });

  it("persists a partial upload, then replaces it atomically", async () => {
    // First upload: 1 round (partial season) → is_complete false, 1 match.
    const r1 = await commitSoccerUpload({
      csv: csv("1,2025-08-16,Liverpool,Bournemouth,2,0"),
      leagueId,
      season,
      sourceFilename: "first.csv",
      db,
    });
    expect(r1.ok).toBe(true);
    expect(r1.permalink).toBe(`/soccer/premier-league/${encodeURIComponent(season)}`);
    expect(r1.isComplete).toBe(false);

    const ds1 = await db.select().from(datasets).where(and(eq(datasets.leagueId, leagueId), eq(datasets.season, season)));
    expect(ds1).toHaveLength(1);
    const firstId = ds1[0].id;
    const m1 = await db.select().from(matches).where(eq(matches.datasetId, firstId));
    expect(m1).toHaveLength(1);
    expect(m1[0].payload).toMatchObject({ home_team: "Liverpool", home_goals: 2 });

    // Second upload for the same (league, season): replaces it (2 matches).
    const r2 = await commitSoccerUpload({
      csv: csv("1,2025-08-16,Liverpool,Bournemouth,2,0", "1,2025-08-16,Arsenal,Chelsea,1,1"),
      leagueId,
      season,
      sourceFilename: "second.csv",
      db,
    });
    expect(r2.ok).toBe(true);
    expect(r2.datasetId).not.toBe(firstId);

    // Still exactly one dataset for (league, season); old one + its matches gone.
    const ds2 = await db.select().from(datasets).where(and(eq(datasets.leagueId, leagueId), eq(datasets.season, season)));
    expect(ds2).toHaveLength(1);
    expect(ds2[0].id).toBe(r2.datasetId);
    const oldMatches = await db.select().from(matches).where(eq(matches.datasetId, firstId));
    expect(oldMatches).toHaveLength(0); // cascade-deleted
    const newMatches = await db.select().from(matches).where(eq(matches.datasetId, r2.datasetId!));
    expect(newMatches).toHaveLength(2);
  });
});
