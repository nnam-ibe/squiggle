import type {
  CriterionEval,
  EntityAgg,
  EntityType,
  NormalizedResult,
  RowError,
  SportAdapter,
} from "../types";
import type { F1PointsRules } from "@/config/schema";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Finish values that classify a driver out of the points (no race points scored).
const NO_POINTS_FINISH = new Set([
  "",
  "DNF",
  "DNS",
  "DSQ",
  "DQ",
  "NC",
  "RET",
  "NA",
  "EX",
  "WD",
]);

function lower(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) out[k.trim().toLowerCase()] = v;
  return out;
}

/** Parse a finishing position: a positive integer, or `null` for DNF/NC/blank, or "invalid". */
function parseFinish(value: string | undefined): number | null | "invalid" {
  const t = (value ?? "").trim();
  if (NO_POINTS_FINISH.has(t.toUpperCase())) return null;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1) return n;
  return "invalid";
}

function parseRow(raw: Record<string, string>, row: number): NormalizedResult | RowError {
  const r = lower(raw);
  const round = Number(r["round"]);
  if (!Number.isInteger(round) || round < 1) {
    return { row, field: "round", message: "round must be a positive integer" };
  }
  const playedOn = (r["date"] ?? "").trim();
  if (!DATE_RE.test(playedOn)) {
    return { row, field: "date", message: "date must be YYYY-MM-DD" };
  }
  const driver = (r["driver"] ?? "").trim();
  if (!driver) return { row, field: "driver", message: "driver is required" };
  const constructorName = (r["constructor"] ?? "").trim();
  if (!constructorName) {
    return { row, field: "constructor", message: "constructor is required" };
  }

  const finishPosition = parseFinish(r["finish_position"]);
  if (finishPosition === "invalid") {
    return {
      row,
      field: "finish_position",
      message: "finish_position must be a positive integer or a status like DNF/NC",
    };
  }

  let sprintPosition: number | null = null;
  const rawSprint = (r["sprint_position"] ?? "").trim();
  if (rawSprint !== "") {
    const sp = parseFinish(rawSprint);
    if (sp === "invalid") {
      return { row, field: "sprint_position", message: "sprint_position must be a positive integer or blank" };
    }
    sprintPosition = sp;
  }

  const fastestLap = /^(true|1|yes)$/i.test((r["fastest_lap"] ?? "").trim());

  return {
    round,
    playedOn,
    race: (r["race"] ?? "").trim() || undefined,
    driver,
    constructorName,
    finishPosition,
    fastestLap,
    sprintPosition,
  };
}

interface SeasonRange {
  fromSeason: number;
  toSeason: number | null;
}

/** The rule block whose [fromSeason, toSeason] range contains the given season year. */
function pickBlock<T extends SeasonRange>(blocks: T[] | undefined, year: number): T | undefined {
  return blocks?.find(
    (b) => year >= b.fromSeason && (b.toSeason == null || year <= b.toSeason),
  );
}

/**
 * F1 adapter, bound to a season's points rules (race table, fastest-lap, sprint),
 * which vary by era. Supports both drivers' and constructors' standings.
 */
export function createF1Adapter(season: string | number, rules: F1PointsRules): SportAdapter {
  const year = typeof season === "number" ? season : parseInt(season, 10);
  const raceBlock = pickBlock(rules.race, year);
  const flBlock = pickBlock(rules.fastestLap, year);
  const sprintBlock = pickBlock(rules.sprint, year);

  function rowPoints(r: NormalizedResult): number {
    let pts = 0;
    const finish = r.finishPosition;
    if (finish != null && raceBlock && finish <= raceBlock.points.length) {
      pts += raceBlock.points[finish - 1];
    }
    // Fastest-lap point: only when the rule exists for the season AND the driver
    // finished within the eligible top positions.
    if (r.fastestLap && flBlock && finish != null && finish <= flBlock.maxFinishPosition) {
      pts += flBlock.points;
    }
    if (r.sprintPosition != null && sprintBlock && r.sprintPosition <= sprintBlock.points.length) {
      pts += sprintBlock.points[r.sprintPosition - 1];
    }
    return pts;
  }

  function accumulate(
    results: NormalizedResult[],
    entityType: EntityType,
    onlyEntities?: Set<string>,
  ): Map<string, EntityAgg> {
    const table = new Map<string, EntityAgg>();
    const get = (name: string): EntityAgg => {
      let a = table.get(name);
      if (!a) {
        a = { entity: name, points: 0, stats: { entries: 0, wins: 0, podiums: 0 }, finishCounts: [] };
        table.set(name, a);
      }
      return a;
    };

    for (const r of results) {
      const entity = entityType === "driver" ? r.driver : r.constructorName;
      if (!entity) continue;
      if (onlyEntities && !onlyEntities.has(entity)) continue;

      const a = get(entity);
      a.points += rowPoints(r);
      a.stats.entries += 1;

      if (r.finishPosition != null) {
        const idx = r.finishPosition - 1;
        a.finishCounts![idx] = (a.finishCounts![idx] ?? 0) + 1;
        if (r.finishPosition === 1) a.stats.wins += 1;
        if (r.finishPosition <= 3) a.stats.podiums += 1;
      }
    }

    return table;
  }

  const points: CriterionEval = (group, ctx) => {
    const keys = new Map<string, number>();
    for (const e of group) keys.set(e, ctx.agg.get(e)?.points ?? 0);
    return keys;
  };

  return {
    entityTypes: ["driver", "constructor"],
    parseRow,
    accumulate,
    criteria: { points },
  };
}
