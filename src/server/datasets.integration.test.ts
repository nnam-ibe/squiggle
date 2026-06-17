import { describe, it, expect, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { datasets, matches } from "@/db/schema";
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

describe.skipIf(!process.env.DATABASE_URL)("getDatasetStandings — F1 entity toggle (integration)", () => {
  const db = process.env.DATABASE_URL ? getDb() : (null as never);
  const league = "formula-1";
  const season = "2024"; // configured season → constructor colors resolve from the roster

  // One driver per race row; drivers map to their constructor (matching config names).
  const race = (round: number, date: string, rows: [string, string, number][]) =>
    rows.map(([driver, constructor, finish_position]) => ({
      datasetId: "", // filled after the dataset insert
      round,
      playedOn: date,
      payload: { driver, constructor, finish_position, fastest_lap: false, sprint_position: null },
    }));

  afterAll(async () => {
    if (process.env.DATABASE_URL) {
      await db.delete(datasets).where(and(eq(datasets.leagueId, league), eq(datasets.season, season)));
    }
  });

  it("computes drivers vs constructors from the same rows and reflects the mode", async () => {
    const [ds] = await db
      .insert(datasets)
      .values({ sport: "motorsport", leagueId: league, season, rowCount: 6, roundsPresent: 2, isComplete: true })
      .returning({ id: datasets.id });

    const rows = [
      ...race(1, "2024-03-02", [
        ["Verstappen", "Red Bull Racing", 1],
        ["Norris", "McLaren", 2],
        ["Leclerc", "Ferrari", 3],
      ]),
      ...race(2, "2024-03-09", [
        ["Norris", "McLaren", 1],
        ["Verstappen", "Red Bull Racing", 2],
        ["Leclerc", "Ferrari", 3],
      ]),
    ].map((r) => ({ ...r, datasetId: ds.id }));
    await db.insert(matches).values(rows);

    // Drivers (default) — entities advertised, driver inherits its constructor color.
    const drivers = await getDatasetStandings({ sport: "motorsport", league, season });
    expect(drivers).not.toBeNull();
    expect(drivers!.entityType).toBe("driver");
    expect(drivers!.entity).toBe("drivers");
    expect(drivers!.entities).toEqual(["drivers", "constructors"]);
    const dFinal = drivers!.standings.rounds.at(-1)!.standings;
    expect(dFinal.map((s) => s.entity)).toContain("Verstappen");
    // Verstappen (43) and Norris (43) tie on points; count-back (1 win each... Norris 1 win, Max 1 win)
    expect(dFinal.find((s) => s.entity === "Verstappen")!.points).toBe(43);
    expect(drivers!.colors["Verstappen"]).toBe("#3671C6"); // Red Bull Racing color

    // Constructors — recomputed server-side, colors straight from the roster.
    const cons = await getDatasetStandings({ sport: "motorsport", league, season, entity: "constructors" });
    expect(cons!.entityType).toBe("constructor");
    expect(cons!.entity).toBe("constructors");
    const cFinal = cons!.standings.rounds.at(-1)!.standings;
    expect(cFinal.map((s) => s.entity)).toEqual(
      expect.arrayContaining(["McLaren", "Red Bull Racing", "Ferrari"]),
    );
    expect(cons!.colors["McLaren"]).toBe("#FF8000");
  });
});
