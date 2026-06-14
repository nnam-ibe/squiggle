import { describe, it, expect } from "vitest";
import { computeStandings } from "./standings";
import { createSoccerAdapter } from "./sports/soccer";
import type { NormalizedResult } from "./types";
import type { TieBreaker } from "@/config/schema";

const FORMAT = { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0 };
const adapter = createSoccerAdapter(FORMAT);

function m(
  round: number,
  date: string,
  home: string,
  homeGoals: number,
  awayGoals: number,
  away: string,
): NormalizedResult {
  return { round, playedOn: date, homeTeam: home, homeGoals, awayGoals, awayTeam: away };
}

/** Final-round standings as an ordered list of entity names. */
function finalOrder(results: NormalizedResult[], tieBreakers: TieBreaker[]): string[] {
  const s = computeStandings({ results, entityType: "team", tieBreakers, adapter });
  return s.rounds.at(-1)!.standings.map((x) => x.entity);
}

describe("basic soccer table", () => {
  const results = [
    m(1, "2025-01-01", "A", 2, 0, "B"),
    m(1, "2025-01-01", "C", 1, 1, "D"),
    m(2, "2025-01-08", "A", 0, 0, "C"),
    m(2, "2025-01-08", "B", 3, 1, "D"),
  ];

  it("computes points and goal difference correctly", () => {
    const s = computeStandings({
      results,
      entityType: "team",
      tieBreakers: ["points", "goal_difference", "goals_scored"],
      adapter,
    });
    const last = s.rounds.at(-1)!.standings;
    const a = last.find((x) => x.entity === "A")!;
    expect(a.points).toBe(4); // win + draw
    expect(a.stats.gd).toBe(2);
    expect(last[0].position).toBe(1);
  });

  it("emits one snapshot per round with results", () => {
    const s = computeStandings({
      results,
      entityType: "team",
      tieBreakers: ["points"],
      adapter,
    });
    expect(s.rounds.map((r) => r.round)).toEqual([1, 2]);
  });
});

describe("head-to-head ordering relative to goal difference", () => {
  // A & B both finish on 4 points. B has the better overall GD (+4 vs +1),
  // but A won the head-to-head meeting.
  const results = [
    m(1, "2025-01-01", "A", 1, 0, "B"), // A beats B head-to-head
    m(2, "2025-01-08", "A", 1, 1, "C"),
    m(1, "2025-01-01", "B", 5, 0, "D"),
    m(2, "2025-01-08", "B", 1, 1, "E"),
  ];

  it("La Liga (H2H before GD) ranks A above B", () => {
    const order = finalOrder(results, [
      "points",
      "head_to_head_points",
      "head_to_head_goal_difference",
      "goal_difference",
      "goals_scored",
    ]);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
  });

  it("Bundesliga (H2H after GD) ranks B above A", () => {
    const order = finalOrder(results, [
      "points",
      "goal_difference",
      "goals_scored",
      "head_to_head_points",
    ]);
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("A"));
  });
});

describe("three-way head-to-head mini-table", () => {
  // X, Y, Z all finish on 6 points. Z has by far the best overall GD (+8),
  // but the head-to-head mini-table orders them X > Y > Z.
  const results = [
    m(1, "2025-01-01", "X", 1, 0, "Y"),
    m(2, "2025-01-08", "X", 1, 0, "Z"),
    m(3, "2025-01-15", "Y", 1, 0, "Z"),
    m(4, "2025-01-22", "Y", 1, 0, "P"), // filler so Y reaches 6
    m(5, "2025-01-29", "Z", 5, 0, "Q"), // Z piles on GD vs fillers
    m(6, "2025-02-05", "Z", 5, 0, "R"),
  ];

  it("orders X > Y > Z by head-to-head despite Z's superior GD", () => {
    const order = finalOrder(results, [
      "points",
      "head_to_head_points",
      "head_to_head_goal_difference",
      "goal_difference",
    ]);
    const top3 = order.filter((e) => ["X", "Y", "Z"].includes(e));
    expect(top3).toEqual(["X", "Y", "Z"]);
  });
});

describe("head-to-head falls through when teams haven't met equally", () => {
  // M & N both on 3 points and never played each other; M has the better GD.
  const results = [
    m(1, "2025-01-01", "M", 2, 0, "P"),
    m(1, "2025-01-01", "N", 1, 0, "Q"),
  ];

  it("uses goal difference (H2H ineligible) → M above N", () => {
    const order = finalOrder(results, [
      "points",
      "head_to_head_points",
      "goal_difference",
    ]);
    expect(order.indexOf("M")).toBeLessThan(order.indexOf("N"));
  });
});

describe("snapshot by date played (postponements)", () => {
  // The E–F fixture is labelled round 1 but was postponed and actually played on
  // 2025-01-20. Round 1's other matches (the majority) are on 2025-01-01, so
  // round 1's representative date stays 2025-01-01 and the outlier is excluded
  // until a later round's cutoff reaches its real date.
  const results = [
    m(1, "2025-01-01", "A", 1, 0, "B"),
    m(1, "2025-01-01", "C", 1, 0, "D"),
    m(1, "2025-01-01", "G", 1, 0, "H"),
    m(1, "2025-01-20", "E", 1, 0, "F"), // postponed round-1 fixture
    m(2, "2025-01-08", "A", 1, 0, "C"),
    m(3, "2025-01-15", "B", 1, 0, "D"),
    m(4, "2025-01-22", "A", 1, 0, "G"),
  ];

  it("excludes the postponed fixture from earlier snapshots and includes it later", () => {
    const s = computeStandings({
      results,
      entityType: "team",
      tieBreakers: ["points", "goal_difference"],
      adapter,
    });
    const namesAt = (round: number) =>
      s.rounds.find((r) => r.round === round)!.standings.map((x) => x.entity);

    expect(namesAt(1)).not.toContain("E"); // not counted at its nominal round
    expect(namesAt(3)).not.toContain("E"); // still before its real date (Jan 15 < Jan 20)
    expect(namesAt(4)).toContain("E"); // round 4 cutoff (Jan 22) reaches it
  });
});
