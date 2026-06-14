export type EntityType = "team" | "driver" | "constructor";

/** A single result row, normalized across sports. */
export interface NormalizedResult {
  round: number;
  playedOn: string; // ISO YYYY-MM-DD (date played)

  // soccer
  homeTeam?: string;
  awayTeam?: string;
  homeGoals?: number;
  awayGoals?: number;

  // formula 1 (one row per driver per race)
  race?: string;
  driver?: string;
  constructorName?: string; // avoids clashing with Object.prototype.constructor
  finishPosition?: number | null; // null = DNF / NC / no classification
  fastestLap?: boolean;
  sprintPosition?: number | null;
}

/** Structured parse/validation error tied to a source row. */
export interface RowError {
  row: number; // 1-based source row (excludes header)
  field?: string;
  message: string;
}

/** Per-entity aggregated stats. Keys present depend on the sport. */
export interface EntityAgg {
  entity: string;
  points: number;
  stats: Record<string, number>;
  /** F1 only: finishes by position, index 0 = wins, 1 = 2nds, … (for count_back). */
  finishCounts?: number[];
}

export interface EntityStanding {
  entity: string;
  position: number; // 1 = top
  points: number;
  stats: Record<string, number>;
}

export interface RoundSnapshot {
  round: number;
  cutoffDate: string;
  standings: EntityStanding[];
}

export interface Standings {
  entityType: EntityType;
  rounds: RoundSnapshot[];
}

/** Context handed to each tie-breaker criterion when ranking a tied group. */
export interface RankContext {
  entityType: EntityType;
  results: NormalizedResult[]; // results included up to the snapshot cutoff
  agg: Map<string, EntityAgg>; // overall aggregate for those results
}

/** A sort key where a *higher* value ranks better. Arrays compare lexicographically. */
export type SortKey = number | number[];

/**
 * Evaluates one tie-breaker for a tied group.
 * Returns a key per entity (higher = better), or `null` if not applicable
 * to this group (e.g. head-to-head when members haven't all met equally) —
 * in which case the group is left intact for the next criterion.
 */
export type CriterionEval = (
  group: string[],
  ctx: RankContext,
) => Map<string, SortKey> | null;

export interface SportAdapter {
  entityTypes: EntityType[];
  /** Parse one raw CSV row into a normalized result, or a structured error. */
  parseRow: (raw: Record<string, string>, row: number) => NormalizedResult | RowError;
  /** Aggregate per-entity stats from results, optionally restricted to a subset of entities. */
  accumulate: (
    results: NormalizedResult[],
    entityType: EntityType,
    onlyEntities?: Set<string>,
  ) => Map<string, EntityAgg>;
  /** Named tie-breaker evaluators this sport supports. */
  criteria: Record<string, CriterionEval>;
}
