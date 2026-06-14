import { describe, it, expect } from "vitest";
import {
  getAllLeagues,
  getSeasonRoster,
  getColor,
  getTieBreakers,
  getF1PointsRules,
} from "./leagues";
import { leagueConfigSchema } from "./schema";

describe("league config loading", () => {
  it("loads all six configured leagues", () => {
    const ids = getAllLeagues()
      .map((l) => l.id)
      .sort();
    expect(ids).toEqual([
      "bundesliga",
      "formula-1",
      "la-liga",
      "ligue-1",
      "premier-league",
      "serie-a",
    ]);
  });

  it("exposes rosters and brand colors for a soccer season", () => {
    const roster = getSeasonRoster("premier-league", "2024-25");
    expect(roster).toHaveLength(20);
    expect(getColor("premier-league", "2024-25", "Arsenal")).toBe("#EF0107");
  });

  it("returns undefined color for an unknown entity (caller auto-colors)", () => {
    expect(getColor("premier-league", "2024-25", "Some FC")).toBeUndefined();
  });

  it("reflects each season's promotions (PL 2025-26 includes Leeds)", () => {
    const roster = getSeasonRoster("premier-league", "2025-26") ?? [];
    expect(roster.map((t) => t.name)).toContain("Leeds United");
    expect(roster.map((t) => t.name)).not.toContain("Leicester City");
  });

  it("orders La Liga head-to-head before goal difference", () => {
    const tb = getTieBreakers("la-liga") ?? [];
    expect(tb.indexOf("head_to_head_points")).toBeLessThan(
      tb.indexOf("goal_difference"),
    );
  });

  it("orders Bundesliga head-to-head after goal difference", () => {
    const tb = getTieBreakers("bundesliga") ?? [];
    expect(tb.indexOf("goal_difference")).toBeLessThan(
      tb.indexOf("head_to_head_points"),
    );
  });

  it("provides F1 points rules with the modern race table", () => {
    const rules = getF1PointsRules();
    expect(rules?.race[0].points).toEqual([25, 18, 15, 12, 10, 8, 6, 4, 2, 1]);
    // fastest-lap point only existed 2019-2024
    expect(rules?.fastestLap[0]).toMatchObject({
      fromSeason: 2019,
      toSeason: 2024,
    });
  });
});

describe("config schema validation", () => {
  it("rejects a malformed config with a clear error", () => {
    const bad = {
      id: "x",
      sport: "soccer",
      name: "X",
      format: {
        teams: 20,
        rounds: 38,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
      },
      tieBreakers: ["not_a_real_criterion"],
      seasons: {},
    };
    const result = leagueConfigSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects a bad hex color", () => {
    const bad = {
      id: "x",
      sport: "soccer",
      name: "X",
      format: {
        teams: 1,
        rounds: 1,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
      },
      tieBreakers: ["points"],
      seasons: {
        "2024-25": {
          status: "complete",
          teams: [{ name: "A", short: "A", color: "red" }],
        },
      },
    };
    expect(leagueConfigSchema.safeParse(bad).success).toBe(false);
  });
});
