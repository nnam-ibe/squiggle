import type { Standings } from "@/domain/types";

export interface ChartPoint {
  round: number;
  pos: number;
  /** Cumulative points at this round (drives the StatCard / tooltip). */
  pts: number;
  /** Wins so far — soccer wins, or F1 race wins. */
  w: number;
  /** Soccer draws / losses / goal difference (0 for F1). */
  d: number;
  l: number;
  gd: number;
  /** F1 podiums so far (0 for soccer). */
  pod: number;
}

/** Stroke pattern used to tell apart entities that share a brand color. */
export type LineStyle = "solid" | "dashed" | "dotted";

export interface ChartSeries {
  id: string;
  name: string;
  short: string;
  color: string;
  /** True when another entity in the season shares this color — render with a
   * secondary cue (outline-ring pill/dot) to stay distinguishable. Equivalent to
   * `lineStyle !== "solid"`. */
  dashed: boolean;
  /** Stroke pattern for the line. Members of a shared-color group get distinct
   * patterns (solid, then dashed, then dotted) — e.g. F1 teammates / mid-season
   * driver swaps sharing a constructor color. */
  lineStyle: LineStyle;
  finalPos: number;
  points: ChartPoint[];
}

/** Deterministic fallback color for entities without a configured brand color. */
export function autoColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
}

/** Fallback short code from a name (first 3 alphanumerics, upper-cased). */
function abbreviate(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || name.slice(0, 3);
}

/**
 * Pivot round-by-round standings into one series per entity (its position at each
 * round), resolving brand color + short code (with fallbacks). Sorted by final
 * position so the legend / end-pills read top-to-bottom.
 */
export function buildChartSeries(
  standings: Standings,
  colors: Record<string, string>,
  shorts: Record<string, string>,
): ChartSeries[] {
  const isF1 = standings.entityType !== "team";
  const byEntity = new Map<string, ChartPoint[]>();
  for (const snap of standings.rounds) {
    for (const s of snap.standings) {
      const list = byEntity.get(s.entity) ?? [];
      list.push({
        round: snap.round,
        pos: s.position,
        pts: s.points,
        w: (isF1 ? s.stats.wins : s.stats.won) ?? 0,
        d: isF1 ? 0 : (s.stats.drawn ?? 0),
        l: isF1 ? 0 : (s.stats.lost ?? 0),
        gd: isF1 ? 0 : (s.stats.gd ?? 0),
        pod: isF1 ? (s.stats.podiums ?? 0) : 0,
      });
      byEntity.set(s.entity, list);
    }
  }

  const lastRound = standings.rounds.at(-1);
  const finalPos = new Map<string, number>(
    (lastRound?.standings ?? []).map((s) => [s.entity, s.position]),
  );

  const resolved = [...byEntity.entries()].map(([name, points]) => ({
    name,
    points,
    color: colors[name] ?? autoColor(name),
  }));

  // Disambiguate entities that share a brand color within the season (F1 teammates
  // share their constructor color; a few soccer clubs collide too). The first by
  // name keeps a solid line; the rest cycle through distinct patterns so even a
  // 3-driver constructor (a mid-season swap) stays distinguishable. The assignment
  // is results-independent, so a line's style never flips between rounds.
  const lineStyleByName = new Map<string, LineStyle>();
  const byColor = new Map<string, string[]>();
  for (const r of resolved) {
    const key = r.color.toLowerCase();
    const group = byColor.get(key) ?? [];
    group.push(r.name);
    byColor.set(key, group);
  }
  for (const group of byColor.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.localeCompare(b));
    group.forEach((name, i) => {
      if (i === 0) return; // first stays solid
      // 1 → dashed, 2 → dotted, then alternate so neighbours always differ.
      lineStyleByName.set(name, i % 2 === 1 ? "dashed" : "dotted");
    });
  }

  return resolved
    .map(({ name, points, color }) => {
      const lineStyle = lineStyleByName.get(name) ?? "solid";
      return {
        id: name,
        name,
        short: shorts[name] ?? abbreviate(name),
        color,
        lineStyle,
        dashed: lineStyle !== "solid",
        finalPos: finalPos.get(name) ?? points.at(-1)!.pos,
        points,
      };
    })
    .sort((a, b) => a.finalPos - b.finalPos);
}
