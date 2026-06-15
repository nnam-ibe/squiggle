import { describe, it, expect, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { datasets } from "@/db/schema";
import { commitSoccerUpload } from "@/upload/commit";
import { getDatasetStandings } from "./datasets";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";

describe.skipIf(!process.env.DATABASE_URL)("getDatasetStandings (integration)", () => {
  const db = process.env.DATABASE_URL ? getDb() : (null as never);
  const league = "premier-league";
  // A configured season so colors resolve from the roster (ephemeral DB, isolated).
  const season = "2024-25";

  afterAll(async () => {
    if (process.env.DATABASE_URL) {
      await db.delete(datasets).where(and(eq(datasets.leagueId, league), eq(datasets.season, season)));
    }
  });

  it("returns standings + colors for a seeded dataset", async () => {
    await commitSoccerUpload({
      csv: csv(
        "1,2025-08-16,Liverpool,Bournemouth,3,0",
        "1,2025-08-16,Arsenal,Chelsea,1,1",
        "2,2025-08-23,Arsenal,Liverpool,2,2",
        "2,2025-08-23,Chelsea,Bournemouth,0,1",
      ),
      leagueId: league,
      season,
      db,
    });

    const data = await getDatasetStandings({ sport: "soccer", league, season });
    expect(data).not.toBeNull();
    expect(data!.entityType).toBe("team");
    expect(data!.standings.rounds).toHaveLength(2);
    const final = data!.standings.rounds.at(-1)!.standings;
    expect(final).toHaveLength(4);
    expect(final[0].position).toBe(1);
    // colors resolve from config for known PL teams
    expect(data!.colors["Liverpool"]).toBe("#C8102E");
  });

  it("returns null for a known league with no dataset for that season", async () => {
    const data = await getDatasetStandings({ sport: "soccer", league, season: "itest-missing-9999" });
    expect(data).toBeNull();
  });
});
