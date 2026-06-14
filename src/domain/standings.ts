import { rankEntities } from "./ranking";
import type {
  EntityType,
  NormalizedResult,
  RoundSnapshot,
  SportAdapter,
  Standings,
} from "./types";
import type { TieBreaker } from "@/config/schema";

export interface ComputeOptions {
  results: NormalizedResult[];
  entityType: EntityType;
  tieBreakers: TieBreaker[];
  adapter: SportAdapter;
}

/**
 * Compute position-after-each-round snapshots.
 *
 * The x-axis is the round index, but each round's snapshot reflects everything
 * actually played by that round's cutoff date — so postponed games count at
 * their real date, not retroactively at their nominal round.
 *
 * A postponed fixture keeps its original round number but a much later date, so
 * a round's cutoff is its *representative* date (the median of its match dates),
 * not the max — otherwise one postponed outlier would drag the whole round's
 * cutoff forward. Cutoffs are kept monotonic via a running max across rounds.
 */
export function computeStandings({
  results,
  entityType,
  tieBreakers,
  adapter,
}: ComputeOptions): Standings {
  const datesByRound = new Map<number, string[]>();
  for (const r of results) {
    const arr = datesByRound.get(r.round);
    if (arr) arr.push(r.playedOn);
    else datesByRound.set(r.round, [r.playedOn]);
  }

  const rounds = [...datesByRound.keys()].sort((a, b) => a - b);

  // Cutoff per round = running max of each round's median played date.
  const cutoffByRound = new Map<number, string>();
  let runningMax = "";
  for (const round of rounds) {
    const dates = datesByRound.get(round)!.slice().sort();
    const median = dates[Math.floor((dates.length - 1) / 2)];
    if (median > runningMax) runningMax = median;
    cutoffByRound.set(round, runningMax);
  }

  const snapshots: RoundSnapshot[] = [];

  for (const round of rounds) {
    const cutoff = cutoffByRound.get(round)!;
    // ISO YYYY-MM-DD compares correctly as strings.
    const included = results.filter((r) => r.playedOn <= cutoff);
    const agg = adapter.accumulate(included, entityType);
    const entities = [...agg.keys()];

    const order = rankEntities(
      entities,
      { entityType, results: included, agg },
      tieBreakers,
      adapter.criteria,
    );

    snapshots.push({
      round,
      cutoffDate: cutoff,
      standings: order.map((entity, i) => {
        const a = agg.get(entity)!;
        return { entity, position: i + 1, points: a.points, stats: a.stats };
      }),
    });
  }

  return { entityType, rounds: snapshots };
}
