import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { computeStandings } from "./standings";
import { createF1Adapter } from "./sports/f1";
import { getF1PointsRules, getLeague } from "@/config/leagues";
import type { NormalizedResult } from "./types";
import type { TieBreaker } from "@/config/schema";

/**
 * Accuracy test: run the engine over a full real F1 season (2024 — every race +
 * sprint result, fetched from the Ergast/Jolpica API) and assert its final drivers'
 * and constructors' championship tables match the OFFICIAL FIA standings.
 *
 * The official standings (`*.official.json`) come straight from the championship
 * results endpoint — computed by the FIA, independent of this engine — so
 * engine == official is a genuine accuracy check. A second, independent inline
 * points computation (the documented 2024 rules, no adapter) cross-checks that the
 * raw fixture results really do yield the official points.
 */

const FIX = path.join(process.cwd(), "src/domain/__fixtures__");

interface Row {
  round: number;
  date: string;
  driver: string;
  constructor: string;
  finish: number | null;
  fastestLap: boolean;
  sprint: number | null;
}

interface Official {
  season: string;
  drivers: { pos: number; name: string; points: number; wins: number }[];
  constructors: { pos: number; name: string; points: number }[];
}

function num(v: string): number | null {
  return /^\d+$/.test(v) ? Number(v) : null;
}

function loadFixture(): Row[] {
  const csv = fs.readFileSync(path.join(FIX, "formula-1-2024.csv"), "utf8");
  const [, ...lines] = csv.trim().split("\n");
  return lines.map((line) => {
    const [round, date, , driver, constructor, finish, fastestLap, sprint] = line.split(",");
    return {
      round: Number(round),
      date,
      driver,
      constructor,
      finish: num(finish),
      fastestLap: fastestLap === "true",
      sprint: num(sprint),
    };
  });
}

const official: Official = JSON.parse(fs.readFileSync(path.join(FIX, "formula-1-2024.official.json"), "utf8"));

// Independent reference: the documented 2024 points rules, computed inline (no adapter).
const RACE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT = [8, 7, 6, 5, 4, 3, 2, 1];
function referenceDriverPoints(rows: Row[]): Map<string, number> {
  const pts = new Map<string, number>();
  for (const r of rows) {
    let p = 0;
    if (r.finish != null && r.finish <= RACE.length) p += RACE[r.finish - 1];
    if (r.fastestLap && r.finish != null && r.finish <= 10) p += 1; // 2024: FL point if top 10
    if (r.sprint != null && r.sprint <= SPRINT.length) p += SPRINT[r.sprint - 1];
    pts.set(r.driver, (pts.get(r.driver) ?? 0) + p);
  }
  return pts;
}

const rows = loadFixture();
const results: NormalizedResult[] = rows.map((r) => ({
  round: r.round,
  playedOn: r.date,
  driver: r.driver,
  constructorName: r.constructor,
  finishPosition: r.finish,
  fastestLap: r.fastestLap,
  sprintPosition: r.sprint,
}));

const league = getLeague("formula-1");
if (!league || league.sport !== "motorsport") throw new Error("formula-1 config missing");
const tieBreakers = league.tieBreakers as TieBreaker[];
const rules = getF1PointsRules()!;

function finalTable(entityType: "driver" | "constructor") {
  const standings = computeStandings({
    results,
    entityType,
    tieBreakers,
    adapter: createF1Adapter("2024", rules),
  });
  return { standings, final: standings.rounds.at(-1)!.standings };
}

describe("F1 standings engine accuracy — 2024 season (real, vs official FIA tables)", () => {
  it("covers the whole season (24 rounds, 24 drivers, 10 constructors)", () => {
    const { standings, final } = finalTable("driver");
    expect(standings.rounds).toHaveLength(24);
    expect(final).toHaveLength(24);
    expect(finalTable("constructor").final).toHaveLength(10);
  });

  it("fixture results reproduce the official driver points (independent of the adapter)", () => {
    const ref = referenceDriverPoints(rows);
    for (const d of official.drivers) {
      expect(ref.get(d.name) ?? 0, `reference points for ${d.name}`).toBe(d.points);
    }
  });

  it("final drivers' championship table matches the official FIA standings", () => {
    const engine = finalTable("driver").final.map((s) => ({
      pos: s.position,
      name: s.entity,
      points: s.points,
      wins: s.stats.wins,
    }));
    expect(engine).toEqual(official.drivers);
  });

  it("final constructors' championship table matches the official FIA standings", () => {
    const engine = finalTable("constructor").final.map((s) => ({
      pos: s.position,
      name: s.entity,
      points: s.points,
    }));
    expect(engine).toEqual(official.constructors);
  });

  it("satisfies championship-table invariants", () => {
    const drivers = finalTable("driver").final;
    // positions are 1..N, unique and contiguous
    expect(drivers.map((s) => s.position)).toEqual(drivers.map((_, i) => i + 1));
    // points non-increasing down the table
    for (let i = 1; i < drivers.length; i++) {
      expect(drivers[i].points).toBeLessThanOrEqual(drivers[i - 1].points);
    }
    // the sum of all constructor points equals the sum of all driver points
    const driverTotal = drivers.reduce((sum, s) => sum + s.points, 0);
    const consTotal = finalTable("constructor").final.reduce((sum, s) => sum + s.points, 0);
    expect(consTotal).toBe(driverTotal);
  });
});
