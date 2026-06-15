/* Squiggle — BumpChart. Renders one dataset as tangled position lines. */
const { useRef, useState, useLayoutEffect, useEffect, useMemo } = React;

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
function steppedPath(pts) {
  return 'M ' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ');
}

function BumpChart({ dataset, selectedId, onSelect, t, isDark }) {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(360);
  const [focusRound, setFocusRound] = useState(dataset.rounds);

  useLayoutEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el); setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { setFocusRound(dataset.rounds); }, [selectedId, dataset.id]);

  const N = dataset.rows.length;
  const rounds = dataset.rounds;
  const AXIS_W = 40;
  const PAD_T = 30, PAD_B = 34, PAD_L = 18;
  const PILL_W = t.pillStyle === 'dot' ? 74 : 118;
  const ROW_H = N > 12 ? 27 : 34;
  const H = PAD_T + (N - 1) * ROW_H + PAD_B + ROW_H; // extra for row span
  const minCol = N > 12 ? 30 : 40;
  const avail = wrapW - 1;
  const fitCol = (avail - PAD_L - PILL_W) / (rounds - 1);
  const COL_W = Math.max(minCol, fitCol);
  const plotW = PAD_L + (rounds - 1) * COL_W + PILL_W;

  const xFor = r => PAD_L + (r - 1) * COL_W;
  const yFor = pos => PAD_T + (pos - 1) * ROW_H + ROW_H / 2;

  const rows = useMemo(() => dataset.rows.map(row => ({
    ...row,
    pts: row.hist.map(h => ({ x: xFor(h.round), y: yFor(h.pos), h }))
  })), [dataset, COL_W, ROW_H, N]);

  const dim = isDark ? 'rgba(150,160,178,0.16)' : 'rgba(80,92,112,0.16)';
  const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,28,42,0.06)';
  const axisText = isDark ? 'rgba(220,226,238,0.55)' : 'rgba(30,40,58,0.55)';
  const someSel = !!selectedId;
  const selRow = rows.find(r => r.id === selectedId);
  const lw = t.lineWeight;

  function handleBg(e) {
    if (!selRow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let r = Math.round((px - PAD_L) / COL_W) + 1;
    r = Math.max(1, Math.min(rounds, r));
    setFocusRound(r);
  }

  const focusH = selRow ? selRow.hist[focusRound - 1] : null;
  const focusPt = selRow ? { x: xFor(focusRound), y: yFor(focusH.pos) } : null;

  function badge(color, dashed, size) {
    return React.createElement('span', {
      style: {
        width: size, height: size, borderRadius: 999, flex: 'none',
        background: dashed ? `repeating-conic-gradient(${color} 0 25%, transparent 0 50%)` : color,
        backgroundColor: dashed ? 'transparent' : color,
        boxShadow: dashed ? `inset 0 0 0 2px ${color}` : 'none', display: 'inline-block'
      }
    });
  }

  // Position-axis labels (pinned gutter)
  const yLabels = [];
  for (let p = 1; p <= N; p++) {
    const major = p === 1 || p === N || p % 5 === 0;
    yLabels.push(React.createElement('div', {
      key: p, className: 'sq-ylab', style: {
        position: 'absolute', top: yFor(p) - 9, left: 0, width: AXIS_W - 6,
        textAlign: 'right', fontSize: 11, lineHeight: '18px',
        fontVariantNumeric: 'tabular-nums', fontWeight: major ? 700 : 500,
        color: major ? (isDark ? 'rgba(230,235,245,0.92)' : 'rgba(20,28,42,0.9)') : axisText,
        fontFamily: 'var(--mono)'
      }
    }, p));
  }

  return React.createElement('div', { className: 'sq-chartframe' },
    // pinned y axis
    React.createElement('div', { className: 'sq-yaxis', style: { width: AXIS_W, height: H } },
      React.createElement('div', { className: 'sq-ycap' }, 'POS'),
      ...yLabels
    ),
    // scroller
    React.createElement('div', { className: 'sq-scroll', ref: wrapRef, style: { marginLeft: AXIS_W } },
      React.createElement('svg', {
        width: plotW, height: H, className: 'sq-svg',
        style: { display: 'block' }
      },
        React.createElement('defs', null,
          React.createElement('filter', { id: 'sqglow', x: '-30%', y: '-30%', width: '160%', height: '160%' },
            React.createElement('feGaussianBlur', { stdDeviation: isDark ? 3.2 : 2, result: 'b' }),
            React.createElement('feMerge', null,
              React.createElement('feMergeNode', { in: 'b' }),
              React.createElement('feMergeNode', { in: 'SourceGraphic' })
            )
          )
        ),
        // horizontal gridlines
        Array.from({ length: N }, (_, i) => React.createElement('line', {
          key: 'g' + i, x1: 0, x2: plotW - PILL_W + 10, y1: yFor(i + 1), y2: yFor(i + 1),
          stroke: grid, strokeWidth: 1
        })),
        // vertical round ticks
        Array.from({ length: rounds }, (_, i) => {
          const r = i + 1; const major = r === 1 || r === rounds || r % 5 === 0;
          if (!major && COL_W < 34) return null;
          return React.createElement('line', {
            key: 'v' + r, x1: xFor(r), x2: xFor(r), y1: PAD_T - 6, y2: H - PAD_B + 6,
            stroke: grid, strokeWidth: 1, opacity: major ? 1 : 0.5
          });
        }),
        // bg capture for scrub
        React.createElement('rect', {
          x: 0, y: 0, width: plotW, height: H, fill: 'transparent',
          onClick: handleBg, style: { cursor: selRow ? 'crosshair' : 'default' }
        }),
        // focus guide
        focusPt && React.createElement('line', {
          x1: focusPt.x, x2: focusPt.x, y1: PAD_T - 6, y2: H - PAD_B + 6,
          stroke: selRow.color, strokeWidth: 1.5, strokeDasharray: '2 4', opacity: 0.7
        }),
        // unselected lines
        rows.filter(r => r.id !== selectedId).map(row => {
          const d = t.lineShape === 'stepped' ? steppedPath(row.pts) : smoothPath(row.pts);
          return React.createElement('g', { key: row.id },
            React.createElement('path', {
              d, fill: 'none',
              stroke: someSel ? dim : row.color,
              strokeWidth: someSel ? 1.6 : lw,
              strokeDasharray: row.dashed ? `${lw * 2.6} ${lw * 1.8}` : 'none',
              strokeLinecap: 'round', strokeLinejoin: 'round',
              opacity: 1, style: { transition: 'stroke .25s, stroke-width .2s, opacity .25s' }
            }),
            React.createElement('path', {
              d, fill: 'none', stroke: 'transparent', strokeWidth: 16,
              style: { cursor: 'pointer' }, onClick: () => onSelect(row.id)
            })
          );
        }),
        // selected line on top
        selRow && (() => {
          const d = t.lineShape === 'stepped' ? steppedPath(selRow.pts) : smoothPath(selRow.pts);
          return React.createElement('g', { key: 'sel' },
            React.createElement('path', {
              d, fill: 'none', stroke: selRow.color, strokeWidth: lw + 1.6,
              strokeDasharray: selRow.dashed ? `${(lw + 1.6) * 2.4} ${(lw + 1.6) * 1.6}` : 'none',
              strokeLinecap: 'round', strokeLinejoin: 'round',
              filter: 'url(#sqglow)'
            }),
            selRow.pts.map((p, i) => React.createElement('circle', {
              key: i, cx: p.x, cy: p.y, r: i + 1 === focusRound ? 5 : 2.6,
              fill: i + 1 === focusRound ? '#fff' : selRow.color,
              stroke: selRow.color, strokeWidth: i + 1 === focusRound ? 3 : 0,
              style: { cursor: 'pointer' }, onClick: () => setFocusRound(i + 1)
            }))
          );
        })(),
        // x axis labels
        Array.from({ length: rounds }, (_, i) => {
          const r = i + 1; const major = r === 1 || r === rounds || r % 5 === 0;
          if (!major && COL_W < 30) return null;
          if (!major && (COL_W < 46 && r % 2 === 0)) return null;
          return React.createElement('text', {
            key: 'x' + r, x: xFor(r), y: H - 12, textAnchor: 'middle',
            fontSize: 10.5, fill: major ? axisText : (isDark ? 'rgba(220,226,238,0.32)' : 'rgba(30,40,58,0.32)'),
            fontWeight: major ? 700 : 500, fontFamily: 'var(--mono)'
          }, r);
        }),
        // end pills
        rows.map(row => {
          const last = row.pts[row.pts.length - 1];
          const x = last.x + 10, y = last.y;
          const isSel = row.id === selectedId;
          const op = someSel && !isSel ? 0.22 : 1;
          const col = someSel && !isSel ? dim : row.color;
          const txtCol = isDark ? '#0b0e14' : '#0b0e14';
          if (t.pillStyle === 'dot') {
            return React.createElement('g', { key: 'p' + row.id, opacity: op, style: { cursor: 'pointer' }, onClick: () => onSelect(row.id) },
              React.createElement('circle', { cx: x + 8, cy: y, r: 5, fill: col }),
              React.createElement('text', { x: x + 18, y: y + 4, fontSize: 12, fontWeight: 800, fill: someSel && !isSel ? axisText : (isDark ? '#fff' : '#0b0e14'), fontFamily: 'var(--mono)' }, row.finalPos)
            );
          }
          const w = 92, h = 22;
          return React.createElement('g', { key: 'p' + row.id, opacity: op, style: { cursor: 'pointer' }, onClick: () => onSelect(row.id), transform: `translate(${x},${y - h / 2})` },
            React.createElement('rect', { x: 0, y: 0, width: w, height: h, rx: 6, fill: col, opacity: row.dashed ? 0.18 : (isSel || !someSel ? 1 : 1) }),
            row.dashed && React.createElement('rect', { x: 0.75, y: 0.75, width: w - 1.5, height: h - 1.5, rx: 5.25, fill: 'none', stroke: col, strokeWidth: 1.5, strokeDasharray: '4 3' }),
            t.pillStyle === 'badge' && React.createElement('circle', { cx: 12, cy: h / 2, r: 5.5, fill: row.dashed ? 'none' : (isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)'), stroke: row.dashed ? col : 'none', strokeWidth: 2 }),
            React.createElement('text', {
              x: t.pillStyle === 'badge' ? 24 : 9, y: h / 2 + 4, fontSize: 11.5, fontWeight: 800,
              fill: row.dashed ? col : txtCol, fontFamily: 'var(--mono)', letterSpacing: '0.3px'
            }, row.short),
            React.createElement('text', {
              x: w - 8, y: h / 2 + 4, textAnchor: 'end', fontSize: 11.5, fontWeight: 800,
              fill: row.dashed ? col : 'rgba(11,14,20,0.62)', fontFamily: 'var(--mono)'
            }, row.finalPos)
          );
        })
      )
    ),
    // stat card overlay
    selRow && React.createElement(StatCard, { row: selRow, h: focusH, round: focusRound, dataset, isDark, badge, onClose: () => onSelect(null) })
  );
}

function StatCard({ row, h, round, dataset, isDark, badge, onClose }) {
  const accentBad = '#ff6b6b';
  const isF1 = dataset.sport === 'f1';
  return React.createElement('div', { className: 'sq-statcard' },
    React.createElement('div', { className: 'sq-sc-head' },
      badge(row.color, row.dashed, 16),
      React.createElement('div', { className: 'sq-sc-name' },
        React.createElement('div', { className: 'sq-sc-team' }, row.name),
        row.cons ? React.createElement('div', { className: 'sq-sc-sub' }, row.cons) : null
      ),
      React.createElement('button', { className: 'sq-sc-close', onClick: onClose, 'aria-label': 'Close' }, '×')
    ),
    React.createElement('div', { className: 'sq-sc-round' },
      React.createElement('span', { className: 'sq-sc-rlab' }, dataset.xLabel + ' ' + round),
      React.createElement('span', { className: 'sq-sc-pos' }, 'P', React.createElement('b', null, h.pos))
    ),
    isF1
      ? React.createElement('div', { className: 'sq-sc-stats' },
        stat('Points', h.pts),
        stat('Wins', h.w, h.w > 0),
        stat('Podiums', h.pod)
      )
      : React.createElement('div', null,
        React.createElement('div', { className: 'sq-sc-stats' },
          stat('Points', h.pts),
          stat('Played', h.w + h.d + h.l),
          stat('GD', (h.gd >= 0 ? '+' : '') + h.gd, h.gd >= 0)
        ),
        React.createElement('div', { className: 'sq-sc-wdl' },
          wdl('W', h.w, '#3ee07f'), wdl('D', h.d, isDark ? '#9aa6b6' : '#7a8499'), wdl('L', h.l, accentBad)
        )
      ),
    React.createElement('div', { className: 'sq-sc-hint' }, 'Tap the chart to scrub ' + (isF1 ? 'rounds' : 'matchweeks'))
  );
  function stat(label, val, good) {
    return React.createElement('div', { className: 'sq-sc-stat' },
      React.createElement('div', { className: 'sq-sc-val', style: good === false ? { color: accentBad } : good === true ? { color: '#3ee07f' } : null }, val),
      React.createElement('div', { className: 'sq-sc-lab' }, label)
    );
  }
  function wdl(label, val, color) {
    return React.createElement('div', { className: 'sq-sc-wdlcell' },
      React.createElement('span', { className: 'sq-sc-wdldot', style: { background: color } }),
      React.createElement('span', { className: 'sq-sc-wdlval' }, val),
      React.createElement('span', { className: 'sq-sc-wdllab' }, label)
    );
  }
}

window.BumpChart = BumpChart;
