import type { CriterionEval, RankContext, SortKey } from "./types";
import type { TieBreaker } from "@/config/schema";

/** Compare two sort keys so the *better* (higher) one sorts first (negative). */
export function compareKeys(a: SortKey, b: SortKey): number {
  const aa = Array.isArray(a) ? a : [a];
  const bb = Array.isArray(b) ? b : [b];
  const n = Math.max(aa.length, bb.length);
  for (let i = 0; i < n; i++) {
    const diff = (bb[i] ?? 0) - (aa[i] ?? 0); // descending: higher first
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Rank entities by applying tie-breakers in order, using a grouping approach so
 * head-to-head criteria operate on the mini-table of only the tied entities.
 *
 * `playoff` is non-computable and skipped; `alphabetical` is applied last as the
 * deterministic fallback so the result is always totally ordered.
 */
export function rankEntities(
  entities: string[],
  ctx: RankContext,
  tieBreakers: TieBreaker[],
  criteria: Record<string, CriterionEval>,
): string[] {
  let groups: string[][] = [[...entities]];

  for (const tb of tieBreakers) {
    if (tb === "alphabetical" || tb === "playoff") continue;
    const evaluate = criteria[tb];
    if (!evaluate) continue;

    const nextGroups: string[][] = [];
    for (const group of groups) {
      if (group.length === 1) {
        nextGroups.push(group);
        continue;
      }
      const keys = evaluate(group, ctx);
      if (!keys) {
        nextGroups.push(group); // criterion not applicable; keep tied
        continue;
      }
      const sorted = [...group].sort((x, y) =>
        compareKeys(keys.get(x) ?? 0, keys.get(y) ?? 0),
      );
      // Split the sorted list into runs of equal key (still-tied subgroups).
      let run: string[] = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const tied =
          compareKeys(keys.get(sorted[i - 1]) ?? 0, keys.get(sorted[i]) ?? 0) === 0;
        if (tied) {
          run.push(sorted[i]);
        } else {
          nextGroups.push(run);
          run = [sorted[i]];
        }
      }
      nextGroups.push(run);
    }
    groups = nextGroups;
  }

  // Deterministic final fallback: alphabetical within any still-tied group.
  return groups.flatMap((g) => [...g].sort((a, b) => a.localeCompare(b)));
}
