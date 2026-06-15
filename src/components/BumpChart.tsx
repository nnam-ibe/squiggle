"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartSeries } from "./bump-chart-data";

/** Catmull-Rom smoothed path through the points (design default line shape). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const AXIS_W = 40;
const PAD_T = 30;
const PAD_B = 34;
const PAD_L = 18;
const PILL_W = 118;
const PILL_H = 22;
const LINE_W = 2.6;

export function BumpChart({ series, rounds }: { series: ChartSeries[]; rounds: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(360);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = series.length;
  const rowH = n > 12 ? 27 : 34;
  const h = PAD_T + (n - 1) * rowH + PAD_B + rowH;
  const minCol = n > 12 ? 30 : 40;
  const fitCol = (wrapW - 1 - PAD_L - PILL_W) / Math.max(1, rounds - 1);
  const colW = Math.max(minCol, fitCol);
  const plotW = PAD_L + (rounds - 1) * colW + PILL_W;

  const xFor = (r: number) => PAD_L + (r - 1) * colW;
  const yFor = (pos: number) => PAD_T + (pos - 1) * rowH + rowH / 2;

  const positions = Array.from({ length: n }, (_, i) => i + 1);
  const roundTicks = Array.from({ length: rounds }, (_, i) => i + 1);
  const isMajorRound = (r: number) => r === 1 || r === rounds || r % 5 === 0;

  return (
    <div className="relative overflow-hidden rounded-panel border border-line bg-panel">
      {/* pinned position axis */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 border-r border-line bg-panel"
        style={{ width: AXIS_W, height: h }}
      >
        <div className="absolute left-0 top-2 w-[34px] text-right font-mono text-[9px] font-bold tracking-[0.1em] text-fg3">
          POS
        </div>
        {positions.map((p) => {
          const major = p === 1 || p === n || p % 5 === 0;
          return (
            <div
              key={p}
              className="absolute left-0 text-right font-mono [font-variant-numeric:tabular-nums]"
              style={{
                top: yFor(p) - 9,
                width: AXIS_W - 6,
                fontSize: 11,
                lineHeight: "18px",
                fontWeight: major ? 700 : 500,
                color: major ? "var(--fg)" : "var(--fg3)",
              }}
            >
              {p}
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden" style={{ marginLeft: AXIS_W }}>
        <svg width={plotW} height={h} className="block">
          {/* horizontal gridlines */}
          {positions.map((p) => (
            <line
              key={`g${p}`}
              x1={0}
              x2={plotW - PILL_W + 10}
              y1={yFor(p)}
              y2={yFor(p)}
              stroke="var(--line)"
              strokeWidth={1}
            />
          ))}
          {/* vertical round ticks (major, or all when columns are wide enough) */}
          {roundTicks.map((r) => {
            const major = isMajorRound(r);
            if (!major && colW < 34) return null;
            return (
              <line
                key={`v${r}`}
                x1={xFor(r)}
                x2={xFor(r)}
                y1={PAD_T - 6}
                y2={h - PAD_B + 6}
                stroke="var(--line)"
                strokeWidth={1}
                opacity={major ? 1 : 0.5}
              />
            );
          })}
          {/* lines */}
          {series.map((row) => (
            <path
              key={row.id}
              d={smoothPath(row.points.map((pt) => ({ x: xFor(pt.round), y: yFor(pt.pos) })))}
              fill="none"
              stroke={row.color}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* x-axis round labels */}
          {roundTicks.map((r) => {
            const major = isMajorRound(r);
            if (!major && colW < 30) return null;
            if (!major && colW < 46 && r % 2 === 0) return null;
            return (
              <text
                key={`x${r}`}
                x={xFor(r)}
                y={h - 12}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={major ? 700 : 500}
                fill={major ? "var(--fg2)" : "var(--fg3)"}
                fontFamily="var(--mono)"
              >
                {r}
              </text>
            );
          })}
          {/* end pills: short code + final position */}
          {series.map((row) => {
            const last = row.points[row.points.length - 1];
            const x = xFor(last.round) + 10;
            const y = yFor(last.pos);
            return (
              <g key={`p${row.id}`} transform={`translate(${x},${y - PILL_H / 2})`}>
                <rect x={0} y={0} width={92} height={PILL_H} rx={6} fill={row.color} />
                <text x={9} y={PILL_H / 2 + 4} fontSize={11.5} fontWeight={800} fill="#0b0e14" fontFamily="var(--mono)" letterSpacing="0.3">
                  {row.short}
                </text>
                <text
                  x={92 - 8}
                  y={PILL_H / 2 + 4}
                  textAnchor="end"
                  fontSize={11.5}
                  fontWeight={800}
                  fill="rgba(11,14,20,0.62)"
                  fontFamily="var(--mono)"
                >
                  {row.finalPos}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
