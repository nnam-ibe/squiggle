/* Squiggle — app shell: routing, theme, tweaks */
const { useState, useEffect } = React;

const CATALOG = {
  sports: [
    {
      id: 'soccer', name: 'Soccer', icon: 'soccer', leagues: [
        { id: 'pl', name: 'Premier League', country: 'England', seasons: [
          { id: '2024/25', dataset: 'pl_2425' }, { id: '2023/24', dataset: null }, { id: '2022/23', dataset: null }
        ] },
        { id: 'laliga', name: 'La Liga', country: 'Spain', seasons: [{ id: '2024/25', dataset: null }, { id: '2023/24', dataset: null }] },
        { id: 'seriea', name: 'Serie A', country: 'Italy', seasons: [{ id: '2024/25', dataset: null }] }
      ]
    },
    {
      id: 'f1', name: 'Formula 1', icon: 'f1', leagues: [
        { id: 'f1', name: 'Formula 1', country: 'World Championship', seasons: [
          { id: '2024', dataset: 'f1_drivers' }, { id: '2023', dataset: null }
        ] }
      ]
    }
  ]
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "fontPair": "broadcast",
  "lineShape": "smooth",
  "lineWeight": 2.6,
  "pillStyle": "code",
  "homeLayout": "cards",
  "accent": "#ffb020"
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  broadcast: { head: "'Archivo', sans-serif", body: "'Archivo', sans-serif", mono: "'Spline Sans Mono', monospace", hw: '760', tight: '-0.02em' },
  grotesque: { head: "'Schibsted Grotesk', sans-serif", body: "'Schibsted Grotesk', sans-serif", mono: "'Spline Sans Mono', monospace", hw: '700', tight: '-0.015em' },
  editorial: { head: "'Fraunces', serif", body: "'Schibsted Grotesk', sans-serif", mono: "'Spline Sans Mono', monospace", hw: '600', tight: '-0.01em' }
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: 'home' });
  const [toast, setToast] = useState(null);
  const isDark = t.theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS.broadcast;
    root.style.setProperty('--head', fp.head);
    root.style.setProperty('--body', fp.body);
    root.style.setProperty('--mono', fp.mono);
    root.style.setProperty('--hw', fp.hw);
    root.style.setProperty('--tight', fp.tight);
    root.style.setProperty('--accent', t.accent);
  }, [isDark, t.fontPair, t.accent]);

  function fireUpload() {
    setToast('Upload is a demo here — drop a CSV/JSON of round-by-round standings to chart it.');
    clearTimeout(window.__sqToast);
    window.__sqToast = setTimeout(() => setToast(null), 3600);
  }
  function toggleTheme() { setTweak('theme', isDark ? 'light' : 'dark'); }

  return React.createElement('div', { className: 'sq-app' },
    route.name === 'home'
      ? React.createElement(HomeScreen, {
        catalog: CATALOG, t, isDark, setTheme: toggleTheme, onUpload: fireUpload,
        onOpen: id => setRoute({ name: 'dataset', id })
      })
      : React.createElement(DatasetView, {
        initialId: route.id, catalog: CATALOG, t, isDark, setTheme: toggleTheme, onUpload: fireUpload,
        onBack: () => setRoute({ name: 'home' })
      }),

    toast && React.createElement('div', { className: 'sq-toast' }, toast),

    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: 'Theme & type' }),
      React.createElement(TweakRadio, {
        label: 'Theme', value: t.theme, options: ['dark', 'light'],
        onChange: v => setTweak('theme', v)
      }),
      React.createElement(TweakSelect, {
        label: 'Font pairing', value: t.fontPair,
        options: [
          { value: 'broadcast', label: 'Broadcast (Archivo)' },
          { value: 'grotesque', label: 'Grotesque (Schibsted)' },
          { value: 'editorial', label: 'Editorial (Fraunces)' }
        ],
        onChange: v => setTweak('fontPair', v)
      }),
      React.createElement(TweakColor, {
        label: 'Accent', value: t.accent,
        options: ['#3ee07f', '#5b9dff', '#ffb020', '#ff5d8f', '#a98bff'],
        onChange: v => setTweak('accent', v)
      }),
      React.createElement(TweakSection, { label: 'Bump chart' }),
      React.createElement(TweakRadio, {
        label: 'Line shape', value: t.lineShape, options: ['smooth', 'stepped'],
        onChange: v => setTweak('lineShape', v)
      }),
      React.createElement(TweakSlider, {
        label: 'Line weight', value: t.lineWeight, min: 1.4, max: 4.2, step: 0.2, unit: 'px',
        onChange: v => setTweak('lineWeight', v)
      }),
      React.createElement(TweakSelect, {
        label: 'End pill', value: t.pillStyle,
        options: [
          { value: 'badge', label: 'Badge · code · pos' },
          { value: 'code', label: 'Code · pos' },
          { value: 'dot', label: 'Minimal dot' }
        ],
        onChange: v => setTweak('pillStyle', v)
      }),
      React.createElement(TweakSection, { label: 'Homepage' }),
      React.createElement(TweakSelect, {
        label: 'Picker layout', value: t.homeLayout,
        options: [
          { value: 'cards', label: 'Cascading cards' },
          { value: 'stack', label: 'Segmented stack' },
          { value: 'rows', label: 'Chip rows' }
        ],
        onChange: v => setTweak('homeLayout', v)
      })
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
