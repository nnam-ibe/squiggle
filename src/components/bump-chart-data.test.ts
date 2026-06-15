import { describe, it, expect } from "vitest";
import { buildChartSeries, autoColor } from "./bump-chart-data";
import type { Standings } from "@/domain/types";

const standings: Standings = {
  entityType: "team",
  rounds: [
    {
      round: 1,
      cutoffDate: "2025-08-16",
      standings: [
        { entity: "Arsenal", position: 1, points: 3, stats: {} },
        { entity: "Chelsea", position: 2, points: 0, stats: {} },
      ],
    },
    {
      round: 2,
      cutoffDate: "2025-08-23",
      standings: [
        { entity: "Chelsea", position: 1, points: 3, stats: {} },
        { entity: "Arsenal", position: 2, points: 3, stats: {} },
      ],
    },
  ],
};

describe("buildChartSeries", () => {
  it("pivots into per-entity position histories, sorted by final position", () => {
    const series = buildChartSeries(
      standings,
      { Arsenal: "#EF0107" },
      { Arsenal: "ARS", Chelsea: "CHE" },
    );
    expect(series.map((s) => s.id)).toEqual(["Chelsea", "Arsenal"]); // final pos 1, 2
    const arsenal = series.find((s) => s.id === "Arsenal")!;
    expect(arsenal.points).toEqual([
      { round: 1, pos: 1 },
      { round: 2, pos: 2 },
    ]);
    expect(arsenal.finalPos).toBe(2);
    expect(arsenal.short).toBe("ARS");
    expect(arsenal.color).toBe("#EF0107");
  });

  it("falls back to an auto color and abbreviated short when config is missing", () => {
    const series = buildChartSeries(standings, {}, {});
    const chelsea = series.find((s) => s.id === "Chelsea")!;
    expect(chelsea.short).toBe("CHE");
    expect(chelsea.color).toBe(autoColor("Chelsea"));
  });
});
