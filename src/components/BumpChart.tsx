"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartPoint, ChartSeries, LineStyle } from "./bump-chart-data";

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
const DIM = "var(--bump-dim)";

const GOOD = "#3ee07f";
const BAD = "#ff6b6b";

/** SVG dash pattern for a line of the given style + stroke width (round-capped). */
function dashArrayFor(style: LineStyle, w: number): string | undefined {
  if (style === "dashed") return `${(w * 2.4).toFixed(1)} ${(w * 1.7).toFixed(1)}`;
  if (style === "dotted") return `0.01 ${(w * 1.9).toFixed(1)}`;
  return undefined; // solid
}

export function BumpChart({
  series,
  rounds,
  variant = "soccer",
  roundLabel = variant === "f1" ? "Round" : "Matchweek",
}: {
  series: ChartSeries[];
  rounds: number;
  /** Picks the StatCard layout: soccer (W-D-L / GD) or F1 (wins / podiums). */
  variant?: "soccer" | "f1";
  /** Singular x-axis unit shown in the stat card, e.g. "Matchweek" or "Round". */
  roundLabel?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(360);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRound, setFocusRound] = useState(rounds);

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

  const paths = useMemo(
    () =>
      new Map(
        series.map((row) => [
          row.id,
          smoothPath(row.points.map((pt) => ({ x: xFor(pt.round), y: yFor(pt.pos) }))),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, colW, rowH, n],
  );

  const someSel = selectedId != null;
  const selRow = series.find((r) => r.id === selectedId) ?? null;
  // Toggling a line on starts its scrub at the final round.
  const select = (id: string | null) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next != null) setFocusRound(rounds);
  };

  const clampedFocus = selRow ? Math.min(focusRound, selRow.points.length) : focusRound;
  const focusH = selRow ? selRow.points[clampedFocus - 1] : null;
  const focusPt = focusH ? { x: xFor(focusH.round), y: yFor(focusH.pos) } : null;

  // Scrub the focused round from a click/tap anywhere in the plot (when a line is selected).
  function handleScrub(e: React.MouseEvent<SVGRectElement>) {
    if (!selRow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const r = Math.max(1, Math.min(rounds, Math.round((px - PAD_L) / colW) + 1));
    setFocusRound(r);
  }

  return (
    <div>
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
            <defs>
              <filter id="sqglow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation={3.2} result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

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

            {/* scrub capture: tap anywhere to move the focus round (only while a line is selected) */}
            <rect
              x={0}
              y={0}
              width={plotW}
              height={h}
              fill="transparent"
              onClick={handleScrub}
              style={{ cursor: selRow ? "crosshair" : "default" }}
            />

            {/* focus guide for the selected line */}
            {selRow && focusPt && (
              <line
                x1={focusPt.x}
                x2={focusPt.x}
                y1={PAD_T - 6}
                y2={h - PAD_B + 6}
                stroke={selRow.color}
                strokeWidth={1.5}
                strokeDasharray="2 4"
                opacity={0.7}
                pointerEvents="none"
              />
            )}

            {/* unselected lines (dimmed when something is selected) + generous touch hit-areas */}
            {series
              .filter((row) => row.id !== selectedId)
              .map((row) => (
                <g key={row.id}>
                  <path
                    d={paths.get(row.id)}
                    fill="none"
                    stroke={someSel ? DIM : row.color}
                    strokeWidth={someSel ? 1.6 : LINE_W}
                    strokeDasharray={dashArrayFor(row.lineStyle, LINE_W)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke .25s, stroke-width .2s, opacity .25s" }}
                  />
                  <path
                    d={paths.get(row.id)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    style={{ cursor: "pointer" }}
                    onClick={() => select(row.id)}
                  />
                </g>
              ))}

            {/* selected line on top, with glow + scrub dots */}
            {selRow && (
              <g>
                <path
                  d={paths.get(selRow.id)}
                  fill="none"
                  stroke={selRow.color}
                  strokeWidth={LINE_W + 1.6}
                  strokeDasharray={dashArrayFor(selRow.lineStyle, LINE_W + 1.6)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#sqglow)"
                  pointerEvents="none"
                />
                {selRow.points.map((pt, i) => {
                  const isFocus = i + 1 === clampedFocus;
                  return (
                    <circle
                      key={i}
                      cx={xFor(pt.round)}
                      cy={yFor(pt.pos)}
                      r={isFocus ? 5 : 2.6}
                      fill={isFocus ? "#fff" : selRow.color}
                      stroke={selRow.color}
                      strokeWidth={isFocus ? 3 : 0}
                      style={{ cursor: "pointer" }}
                      onClick={() => setFocusRound(i + 1)}
                    />
                  );
                })}
              </g>
            )}

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
                  pointerEvents="none"
                >
                  {r}
                </text>
              );
            })}

            {/* end pills: short code + final position (tap to toggle selection) */}
            {series.map((row) => {
              const last = row.points[row.points.length - 1];
              const x = xFor(last.round) + 10;
              const y = yFor(last.pos);
              const isSel = row.id === selectedId;
              const dimmed = someSel && !isSel;
              const col = dimmed ? DIM : row.color;
              return (
                <g
                  key={`p${row.id}`}
                  transform={`translate(${x},${y - PILL_H / 2})`}
                  opacity={dimmed ? 0.22 : 1}
                  style={{ cursor: "pointer" }}
                  onClick={() => select(row.id)}
                >
                  <rect x={0} y={0} width={92} height={PILL_H} rx={6} fill={col} opacity={row.dashed ? 0.18 : 1} />
                  {row.dashed && (
                    <rect
                      x={0.75}
                      y={0.75}
                      width={92 - 1.5}
                      height={PILL_H - 1.5}
                      rx={5.25}
                      fill="none"
                      stroke={col}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  )}
                  <text
                    x={9}
                    y={PILL_H / 2 + 4}
                    fontSize={11.5}
                    fontWeight={800}
                    fill={row.dashed ? col : "#0b0e14"}
                    fontFamily="var(--mono)"
                    letterSpacing="0.3"
                  >
                    {row.short}
                  </text>
                  <text
                    x={92 - 8}
                    y={PILL_H / 2 + 4}
                    textAnchor="end"
                    fontSize={11.5}
                    fontWeight={800}
                    fill={row.dashed ? col : "rgba(11,14,20,0.62)"}
                    fontFamily="var(--mono)"
                  >
                    {row.finalPos}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selRow && focusH && (
          <StatCard
            row={selRow}
            h={focusH}
            round={clampedFocus}
            roundLabel={roundLabel}
            variant={variant}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      <Legend series={series} selectedId={selectedId} onSelect={select} />
    </div>
  );
}

function StatCard({
  row,
  h,
  round,
  roundLabel,
  variant,
  onClose,
}: {
  row: ChartSeries;
  h: ChartPoint;
  round: number;
  roundLabel: string;
  variant: "soccer" | "f1";
  onClose: () => void;
}) {
  const played = h.w + h.d + h.l;
  return (
    <div className="absolute right-[10px] top-[10px] z-20 w-[214px] max-w-[calc(100%-56px)] rounded-card border-[1.5px] border-line2 bg-[color-mix(in_oklab,var(--panel)_92%,transparent)] px-[14px] py-[13px] shadow-[var(--shadow)] backdrop-blur-[10px]">
      <div className="mb-[11px] flex items-center gap-[9px]">
        <Badge color={row.color} dashed={row.dashed} size={16} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-head text-[15.5px] font-extrabold leading-[1.1] tracking-[-0.01em]">
            {row.name}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-6 flex-none items-center justify-center rounded-lg text-[20px] leading-none text-fg3 transition-colors hover:bg-panel2 hover:text-fg"
        >
          ×
        </button>
      </div>

      <div className="mb-[10px] flex items-center justify-between rounded-[10px] bg-panel2 px-[11px] py-[9px]">
        <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-fg2">
          {roundLabel} {round}
        </span>
        <span className="flex items-baseline gap-[3px] font-head text-[12px] font-bold text-fg3">
          P<b className="text-[21px] font-extrabold text-fg">{h.pos}</b>
        </span>
      </div>

      {variant === "f1" ? (
        <div className="mb-[10px] grid grid-cols-3 gap-2">
          <Stat label="Points" value={h.pts} />
          <Stat label="Wins" value={h.w} tone={h.w > 0 ? "good" : undefined} />
          <Stat label="Podiums" value={h.pod} />
        </div>
      ) : (
        <>
          <div className="mb-[10px] grid grid-cols-3 gap-2">
            <Stat label="Points" value={h.pts} />
            <Stat label="Played" value={played} />
            <Stat label="GD" value={`${h.gd >= 0 ? "+" : ""}${h.gd}`} tone={h.gd >= 0 ? "good" : "bad"} />
          </div>
          <div className="mb-[9px] flex gap-[7px]">
            <Wdl label="W" value={h.w} color={GOOD} />
            <Wdl label="D" value={h.d} color="var(--fg2)" />
            <Wdl label="L" value={h.l} color={BAD} />
          </div>
        </>
      )}

      <div className="text-center font-mono text-[10.5px] tracking-[0.02em] text-fg3">
        Tap the chart to scrub {roundLabel.toLowerCase()}s
      </div>
    </div>
  );
}

/** Color swatch for a team — a ring with a conic dash pattern when the color is shared. */
function Badge({ color, dashed, size }: { color: string; dashed: boolean; size: number }) {
  return (
    <span
      className="flex-none rounded-full"
      style={
        dashed
          ? {
              width: size,
              height: size,
              background: `repeating-conic-gradient(${color} 0 25%, transparent 0 50%)`,
              backgroundColor: "transparent",
              boxShadow: `inset 0 0 0 2px ${color}`,
            }
          : { width: size, height: size, background: color }
      }
    />
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? GOOD : tone === "bad" ? BAD : undefined;
  return (
    <div className="rounded-[10px] bg-panel2 px-[6px] py-2 text-center">
      <div className="font-head text-[18px] font-extrabold leading-none tracking-[-0.02em]" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-fg3">{label}</div>
    </div>
  );
}

function Wdl({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-panel2 px-1 py-[6px]">
      <span className="size-2 flex-none rounded-full" style={{ background: color }} />
      <span className="font-head text-[14px] font-extrabold">{value}</span>
      <span className="font-mono text-[10px] text-fg3">{label}</span>
    </div>
  );
}

function Legend({
  series,
  selectedId,
  onSelect,
}: {
  series: ChartSeries[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-[6px] bg-[linear-gradient(0deg,var(--bg)_70%,transparent)] pb-[14px] pt-[12px]">
      <div className="px-[18px] pb-[9px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg3">
        {selectedId ? "Tap another to compare · tap chart to scrub" : "Tap a line or chip to highlight"}
      </div>
      <div className="flex gap-[7px] overflow-x-auto px-4 pb-[6px] pt-[2px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {series.map((row) => {
          const on = row.id === selectedId;
          const off = selectedId != null && !on;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              aria-pressed={on}
              className={`flex flex-none items-center gap-[6px] whitespace-nowrap rounded-pill border-[1.5px] bg-chip py-[7px] pl-[9px] pr-[11px] transition-[border-color,opacity,transform] hover:-translate-y-px ${
                on ? "" : "border-line"
              } ${off ? "opacity-[0.42]" : ""}`}
              style={on ? { borderColor: row.color, background: `color-mix(in oklab, ${row.color} 16%, var(--chip))` } : undefined}
            >
              <span
                className="size-[10px] flex-none rounded-full"
                style={{
                  background: row.dashed ? "transparent" : row.color,
                  boxShadow: row.dashed ? `inset 0 0 0 2px ${row.color}` : undefined,
                }}
              />
              <span className={`font-mono text-[11px] font-bold ${on ? "text-fg" : "text-fg3"}`}>{row.finalPos}</span>
              <span className="font-head text-[13px] font-bold tracking-[-0.01em]">{row.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
