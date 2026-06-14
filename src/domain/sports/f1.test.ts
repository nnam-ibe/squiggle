import { describe, it, expect } from "vitest";
import { createF1Adapter } from "./f1";
import { getF1PointsRules } from "@/config/leagues";
import type { NormalizedResult } from "../types";

const rules = getF1PointsRules()!;

function race(
  round: number,
  date: string,
  driver: string,
  constructorName: string,
  finishPosition: number | null,
  opts: { fastestLap?: boolean; sprintPosition?: number | null } = {},
): NormalizedResult {
  return {
    round,
    playedOn: date,
    driver,
    constructorName,
    finishPosition,
    fastestLap: opts.fastestLap ?? false,
    sprintPosition: opts.sprintPosition ?? null,
  };
}

function points(adapter: ReturnType<typeof createF1Adapter>, results: NormalizedResult[], entity: string, type: "driver" | "constructor" = "driver") {
  return adapter.accumulate(results, type).get(entity)?.points;
}

describe("F1 config points rules are available", () => {
  it("loads the modern race table", () => {
    expect(rules.race[0].points).toEqual([25, 18, 15, 12, 10, 8, 6, 4, 2, 1]);
  });
});

describe("race points", () => {
  const adapter = createF1Adapter(2024, rules);
  it("awards the race table by finishing position", () => {
    const rs = [race(1, "2024-03-02", "VER", "Red Bull Racing", 1), race(1, "2024-03-02", "NOR", "McLaren", 3)];
    expect(points(adapter, rs, "VER")).toBe(25);
    expect(points(adapter, rs, "NOR")).toBe(15);
  });

  it("scores 0 for a finish outside the points (P11)", () => {
    const rs = [race(1, "2024-03-02", "X", "Y", 11)];
    expect(points(adapter, rs, "X")).toBe(0);
  });
});

describe("DNF scores zero but the entity still appears", () => {
  const adapter = createF1Adapter(2024, rules);
  it("DNF = 0 points, 1 entry, 0 wins", () => {
    const rs = [race(1, "2024-03-02", "HAM", "Mercedes", null)];
    const agg = adapter.accumulate(rs, "driver").get("HAM")!;
    expect(agg.points).toBe(0);
    expect(agg.stats.entries).toBe(1);
    expect(agg.stats.wins).toBe(0);
  });
});

describe("fastest-lap point eligibility (era + top-10)", () => {
  it("2024: +1 when finishing in the top 10", () => {
    const adapter = createF1Adapter(2024, rules);
    expect(points(adapter, [race(1, "2024-03-02", "A", "T", 1, { fastestLap: true })], "A")).toBe(26);
    expect(points(adapter, [race(1, "2024-03-02", "B", "T", 10, { fastestLap: true })], "B")).toBe(2); // P10=1 +1
  });

  it("2024: no fastest-lap point when finishing outside the top 10 (P11)", () => {
    const adapter = createF1Adapter(2024, rules);
    expect(points(adapter, [race(1, "2024-03-02", "C", "T", 11, { fastestLap: true })], "C")).toBe(0);
  });

  it("2025: fastest-lap point no longer awarded (rule ended in 2024)", () => {
    const adapter = createF1Adapter(2025, rules);
    expect(points(adapter, [race(1, "2025-03-16", "A", "T", 1, { fastestLap: true })], "A")).toBe(25);
  });
});

describe("sprint points by era", () => {
  it("2022+ awards 8-7-6-5-4-3-2-1 to the top 8", () => {
    const adapter = createF1Adapter(2024, rules);
    // DNF in the main race isolates the sprint contribution.
    expect(points(adapter, [race(1, "2024-04-21", "A", "T", null, { sprintPosition: 1 })], "A")).toBe(8);
  });

  it("2021 awards only 3-2-1 to the top 3", () => {
    const adapter = createF1Adapter(2021, rules);
    expect(points(adapter, [race(1, "2021-07-17", "A", "T", null, { sprintPosition: 1 })], "A")).toBe(3);
  });
});

describe("constructor standings sum a team's drivers", () => {
  const adapter = createF1Adapter(2024, rules);
  it("sums both cars' points and tracks wins", () => {
    const rs = [
      race(1, "2024-03-02", "VER", "Red Bull Racing", 1),
      race(1, "2024-03-02", "PER", "Red Bull Racing", 2),
    ];
    const agg = adapter.accumulate(rs, "constructor").get("Red Bull Racing")!;
    expect(agg.points).toBe(25 + 18);
    expect(agg.stats.wins).toBe(1);
    expect(agg.stats.entries).toBe(2);
  });
});

describe("parseRow", () => {
  const adapter = createF1Adapter(2025, rules);
  const isError = (x: unknown): x is { message: string } =>
    typeof x === "object" && x !== null && "message" in x;

  it("parses a valid row", () => {
    const out = adapter.parseRow(
      {
        round: "1",
        date: "2025-03-16",
        race: "Australian Grand Prix",
        driver: "Lando Norris",
        constructor: "McLaren",
        finish_position: "1",
        fastest_lap: "false",
        sprint_position: "",
      },
      1,
    );
    expect(isError(out)).toBe(false);
    if (!isError(out)) {
      expect(out.constructorName).toBe("McLaren");
      expect(out.finishPosition).toBe(1);
      expect(out.sprintPosition).toBeNull();
    }
  });

  it("treats DNF as a null finish (no error)", () => {
    const out = adapter.parseRow(
      { round: "1", date: "2025-03-16", driver: "L", constructor: "M", finish_position: "DNF" },
      1,
    );
    expect(isError(out)).toBe(false);
    if (!isError(out)) expect(out.finishPosition).toBeNull();
  });

  it("errors on a non-numeric finish position", () => {
    const out = adapter.parseRow(
      { round: "1", date: "2025-03-16", driver: "L", constructor: "M", finish_position: "abc" },
      3,
    );
    expect(isError(out)).toBe(true);
    if (isError(out)) expect((out as { field: string }).field).toBe("finish_position");
  });

  it("errors on a missing driver", () => {
    const out = adapter.parseRow(
      { round: "1", date: "2025-03-16", driver: "", constructor: "M", finish_position: "1" },
      4,
    );
    expect(isError(out)).toBe(true);
  });

  it("is case-insensitive on headers", () => {
    const out = adapter.parseRow(
      { Round: "2", Date: "2025-03-23", Driver: "Max", Constructor: "RB", Finish_Position: "5" },
      2,
    );
    expect(isError(out)).toBe(false);
    if (!isError(out)) expect(out.finishPosition).toBe(5);
  });
});
