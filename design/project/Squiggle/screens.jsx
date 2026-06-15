/* Squiggle — screens: Icon, Header, Home (pickers), EmptyState, DatasetView */
const useState = React.useState, useEffect = React.useEffect;

function Icon({ name, size = 18 }) {
  if (name === 'soccer') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('circle', { cx: 12, cy: 12, r: 9, stroke: 'currentColor', strokeWidth: 1.8 }),
      React.createElement('path', { d: 'M12 7.5l3.2 2.4-1.2 3.8h-4L8.8 9.9 12 7.5z', fill: 'currentColor' }),
      React.createElement('path', { d: 'M12 3.2v4.3M5 9.6l3.6.4M19 9.6l-3.6.4M7.4 19l1.6-3.4M16.6 19L15 15.6', stroke: 'currentColor', strokeWidth: 1.4 })
    );
  }
  if (name === 'f1') {
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if ((r + c) % 2 === 0) cells.push(React.createElement('rect', { key: r + '' + c, x: 4 + c * 5.3, y: 4 + r * 5.3, width: 5.3, height: 5.3, fill: 'currentColor' }));
    }
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24' },
      React.createElement('rect', { x: 3.4, y: 3.4, width: 17.2, height: 17.2, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }),
      ...cells
    );
  }
  if (name === 'upload') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('path', { d: 'M12 16V5m0 0L8 9m4-4l4 4', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement('path', { d: 'M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' })
    );
  }
  if (name === 'back') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('path', { d: 'M15 5l-7 7 7 7', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
  }
  if (name === 'sun') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('circle', { cx: 12, cy: 12, r: 4, stroke: 'currentColor', strokeWidth: 2 }),
      React.createElement('path', { d: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }));
  }
  if (name === 'moon') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('path', { d: 'M20 14.5A8 8 0 019.5 4a7 7 0 102 13.9 8 8 0 008.5-3.4z', fill: 'currentColor' }));
  }
  if (name === 'chev') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
      React.createElement('path', { d: 'M9 6l6 6-6 6', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
  }
  if (name === 'squiggle') {
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 32 24', fill: 'none' },
      React.createElement('path', { d: 'M2 18C5 18 5 6 9 6s4 12 8 12 4-14 8-14 3 8 5 8', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' }));
  }
  return null;
}

function ThemeToggle({ isDark, onToggle }) {
  return React.createElement('button', { className: 'sq-themebtn', onClick: onToggle, 'aria-label': 'Toggle theme' },
    React.createElement(Icon, { name: isDark ? 'sun' : 'moon', size: 17 }));
}

/* ---------------- HOME ---------------- */
function HomeScreen({ catalog, t, isDark, onOpen, setTheme, onUpload }) {
  const [sport, setSport] = useState('soccer');
  const [league, setLeague] = useState('pl');
  const [season, setSeason] = useState(null);

  const sportObj = catalog.sports.find(s => s.id === sport);
  const leagueObj = sportObj.leagues.find(l => l.id === league) || sportObj.leagues[0];
  const seasonObj = leagueObj.seasons.find(s => s.id === season);

  function pickSport(id) { setSport(id); const s = catalog.sports.find(x => x.id === id); setLeague(s.leagues[0].id); setSeason(null); }
  function pickLeague(id) { setLeague(id); setSeason(null); }
  function pickSeason(id) { setSeason(id); }

  const ready = !!seasonObj;
  const hasData = seasonObj && seasonObj.dataset;

  function go() { if (hasData) onOpen(seasonObj.dataset); }

  const layout = t.homeLayout;

  return React.createElement('div', { className: 'sq-home' },
    React.createElement('div', { className: 'sq-home-top' },
      React.createElement('div', { className: 'sq-brand' },
        React.createElement('span', { className: 'sq-brandmark' }, React.createElement(Icon, { name: 'squiggle', size: 30 })),
        React.createElement('span', { className: 'sq-brandname' }, 'Squiggle')
      ),
      React.createElement(ThemeToggle, { isDark, onToggle: setTheme })
    ),
    React.createElement('div', { className: 'sq-hero' },
      React.createElement('h1', { className: 'sq-hero-h' }, 'Chart the climb.'),
      React.createElement('p', { className: 'sq-hero-p' }, 'Every position, every round. Pick a competition to see the season untangle.')
    ),

    React.createElement('div', { className: 'sq-pickers sq-pk-' + layout },
      React.createElement(PickStep, {
        n: 1, label: 'Sport', layout,
        options: catalog.sports.map(s => ({ id: s.id, name: s.name, icon: s.icon })),
        value: sport, onPick: pickSport
      }),
      React.createElement(PickStep, {
        n: 2, label: 'League', layout,
        options: sportObj.leagues.map(l => ({ id: l.id, name: l.name, meta: l.country })),
        value: league, onPick: pickLeague
      }),
      React.createElement(PickStep, {
        n: 3, label: 'Season', layout,
        options: leagueObj.seasons.map(s => ({ id: s.id, name: s.id, meta: s.dataset ? null : 'no data' })),
        value: season, onPick: pickSeason
      })
    ),

    ready && !hasData
      ? React.createElement(EmptyState, { league: leagueObj.name, season, onUpload })
      : React.createElement('button', {
        className: 'sq-cta', disabled: !hasData, onClick: go
      },
        hasData ? `Open ${leagueObj.name} · ${season}` : 'Pick a season to chart',
        hasData && React.createElement(Icon, { name: 'chev', size: 18 })
      ),

    React.createElement('div', { className: 'sq-uploadrow' },
      React.createElement('div', { className: 'sq-uploadrow-l' },
        React.createElement('span', { className: 'sq-uploadrow-t' }, 'Have your own table?'),
        React.createElement('span', { className: 'sq-uploadrow-s' }, 'CSV or JSON of round-by-round standings.')
      ),
      React.createElement('button', { className: 'sq-uploadbtn', onClick: onUpload },
        React.createElement(Icon, { name: 'upload', size: 16 }), 'Upload data')
    )
  );
}

function PickStep({ n, label, options, value, onPick, layout }) {
  const head = React.createElement('div', { className: 'sq-pk-head' },
    React.createElement('span', { className: 'sq-pk-num' }, n),
    React.createElement('span', { className: 'sq-pk-label' }, label)
  );
  if (layout === 'rows') {
    return React.createElement('div', { className: 'sq-pk-step sq-pk-rowstep' }, head,
      React.createElement('div', { className: 'sq-pk-select' },
        React.createElement('div', { className: 'sq-pk-chips' },
          options.map(o => React.createElement('button', {
            key: o.id, className: 'sq-pk-chip' + (value === o.id ? ' on' : ''), onClick: () => onPick(o.id)
          }, o.icon && React.createElement(Icon, { name: o.icon, size: 15 }), o.name,
            o.meta === 'no data' && React.createElement('span', { className: 'sq-pk-nd' }, '·')))
        )
      )
    );
  }
  if (layout === 'stack') {
    return React.createElement('div', { className: 'sq-pk-step sq-pk-stackstep' }, head,
      React.createElement('div', { className: 'sq-pk-stacklist' },
        options.map(o => React.createElement('button', {
          key: o.id, className: 'sq-pk-stackitem' + (value === o.id ? ' on' : ''), onClick: () => onPick(o.id)
        },
          o.icon && React.createElement('span', { className: 'sq-pk-ic' }, React.createElement(Icon, { name: o.icon, size: 16 })),
          React.createElement('span', { className: 'sq-pk-iname' }, o.name),
          o.meta && React.createElement('span', { className: 'sq-pk-imeta' + (o.meta === 'no data' ? ' nd' : '') }, o.meta),
          React.createElement('span', { className: 'sq-pk-radio' + (value === o.id ? ' on' : '') })
        ))
      )
    );
  }
  // cards (default)
  return React.createElement('div', { className: 'sq-pk-step' }, head,
    React.createElement('div', { className: 'sq-pk-cards' },
      options.map(o => React.createElement('button', {
        key: o.id, className: 'sq-pk-card' + (value === o.id ? ' on' : ''), onClick: () => onPick(o.id)
      },
        o.icon && React.createElement('span', { className: 'sq-pk-cardic' }, React.createElement(Icon, { name: o.icon, size: 20 })),
        React.createElement('span', { className: 'sq-pk-cardname' }, o.name),
        o.meta && React.createElement('span', { className: 'sq-pk-cardmeta' + (o.meta === 'no data' ? ' nd' : '') }, o.meta)
      ))
    )
  );
}

function EmptyState({ league, season, onUpload }) {
  return React.createElement('div', { className: 'sq-empty' },
    React.createElement('div', { className: 'sq-empty-art' },
      React.createElement('svg', { viewBox: '0 0 120 60', width: 120, height: 60, fill: 'none' },
        [0, 1, 2, 3].map(i => React.createElement('path', {
          key: i, d: `M4 ${20 + i * 8} C 30 ${20 + i * 8}, 40 ${50 - i * 12}, 60 ${30 + (i % 2) * 6} S 96 ${14 + i * 9}, 116 ${24 + i * 6}`,
          stroke: ['#3ee07f', '#6CB7EA', '#FF7A00', '#E8112D'][i], strokeWidth: 2, strokeLinecap: 'round', opacity: 0.5, strokeDasharray: '3 4'
        }))
      )
    ),
    React.createElement('div', { className: 'sq-empty-t' }, `No chart for ${league} · ${season} yet`),
    React.createElement('div', { className: 'sq-empty-s' }, 'We don’t have round-by-round standings for this season. Upload your own to squiggle it.'),
    React.createElement('button', { className: 'sq-cta sq-cta-empty', onClick: onUpload },
      React.createElement(Icon, { name: 'upload', size: 17 }), 'Upload data')
  );
}

/* ---------------- DATASET VIEW ---------------- */
function DatasetView({ initialId, catalog, t, isDark, onBack, setTheme, onUpload }) {
  const isF1 = initialId.startsWith('f1');
  const [f1mode, setF1mode] = useState('drivers');
  const dsId = isF1 ? (f1mode === 'drivers' ? 'f1_drivers' : 'f1_constructors') : initialId;
  const dataset = window.SquiggleData.datasets[dsId];
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { setSelectedId(null); }, [f1mode]);

  return React.createElement('div', { className: 'sq-dv' },
    React.createElement('header', { className: 'sq-dv-head' },
      React.createElement('button', { className: 'sq-iconbtn', onClick: onBack, 'aria-label': 'Back' }, React.createElement(Icon, { name: 'back', size: 20 })),
      React.createElement('div', { className: 'sq-dv-title' },
        React.createElement('span', { className: 'sq-dv-icon' }, React.createElement(Icon, { name: dataset.icon, size: 18 })),
        React.createElement('div', { className: 'sq-dv-titletext' },
          React.createElement('div', { className: 'sq-dv-h' },
            dataset.title,
            React.createElement('span', { className: 'sq-dv-season' }, dataset.seasonLabel.split(' · ')[0])
          ),
          React.createElement('div', { className: 'sq-dv-sub' }, dataset.subtitle)
        )
      ),
      React.createElement(ThemeToggle, { isDark, onToggle: setTheme })
    ),

    isF1 && React.createElement('div', { className: 'sq-seg' },
      ['drivers', 'constructors'].map(m => React.createElement('button', {
        key: m, className: 'sq-seg-btn' + (f1mode === m ? ' on' : ''), onClick: () => setF1mode(m)
      }, m === 'drivers' ? 'Drivers' : 'Constructors'))
    ),

    React.createElement('div', { className: 'sq-chartzone' },
      React.createElement(BumpChart, { dataset, selectedId, onSelect: setSelectedId, t, isDark })
    ),

    React.createElement(Legend, { dataset, selectedId, onSelect: setSelectedId })
  );
}

function Legend({ dataset, selectedId, onSelect }) {
  const rows = [...dataset.rows].sort((a, b) => a.finalPos - b.finalPos);
  return React.createElement('div', { className: 'sq-legend' },
    React.createElement('div', { className: 'sq-legend-hint' },
      selectedId ? 'Tap another to compare · tap chart to scrub' : 'Tap a line or chip to highlight'),
    React.createElement('div', { className: 'sq-legend-chips' },
      rows.map(row => {
        const on = row.id === selectedId;
        const off = selectedId && !on;
        return React.createElement('button', {
          key: row.id, className: 'sq-lchip' + (on ? ' on' : '') + (off ? ' off' : ''),
          onClick: () => onSelect(on ? null : row.id), style: on ? { '--c': row.color } : null
        },
          React.createElement('span', {
            className: 'sq-lchip-dot', style: {
              background: row.dashed ? 'transparent' : row.color,
              boxShadow: row.dashed ? `inset 0 0 0 2px ${row.color}` : 'none'
            }
          }),
          React.createElement('span', { className: 'sq-lchip-pos' }, row.finalPos),
          React.createElement('span', { className: 'sq-lchip-name' }, row.short)
        );
      })
    )
  );
}

Object.assign(window, { Icon, ThemeToggle, HomeScreen, PickStep, EmptyState, DatasetView, Legend });
