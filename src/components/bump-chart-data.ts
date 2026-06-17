import type { Standings } from "@/domain/types";

export interface ChartPoint {
  round: number;
  pos: number;
  /** Cumulative points at this round (drives the StatCard / tooltip). */
  pts: number;
  /** Soccer per-round record + goal difference (0 when the sport doesn't track them). */
  w: number;
  d: number;
  l: number;
  gd: number;
}

export interface ChartSeries {
  id: string;
  name: string;
  short: string;
  color: string;
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
  const byEntity = new Map<string, ChartPoint[]>();
  for (const snap of standings.rounds) {
    for (const s of snap.standings) {
      const list = byEntity.get(s.entity) ?? [];
      list.push({
        round: snap.round,
        pos: s.position,
        pts: s.points,
        w: s.stats.won ?? 0,
        d: s.stats.drawn ?? 0,
        l: s.stats.lost ?? 0,
        gd: s.stats.gd ?? 0,
      });
      byEntity.set(s.entity, list);
    }
  }

  const lastRound = standings.rounds.at(-1);
  const finalPos = new Map<string, number>(
    (lastRound?.standings ?? []).map((s) => [s.entity, s.position]),
  );

  return [...byEntity.entries()]
    .map(([name, points]) => ({
      id: name,
      name,
      short: shorts[name] ?? abbreviate(name),
      color: colors[name] ?? autoColor(name),
      finalPos: finalPos.get(name) ?? points.at(-1)!.pos,
      points,
    }))
    .sort((a, b) => a.finalPos - b.finalPos);
}
