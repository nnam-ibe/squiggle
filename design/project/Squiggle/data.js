/* Squiggle — deterministic season data engine.
   Generates plausible round-by-round standings (positions, points, W-D-L, GD)
   from each competitor's final points total + strength. Seeded => stable. */
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Generate a full season. teams: [{id,name,short,color,colorKey,fp}] fp=final points.
  // Lines tangle freely early, then converge smoothly to the canonical (fp-ordered)
  // final table over the closing ~18% of rounds — so endings stay credible.
  function generateSeason(teams, rounds, seed, sport) {
    const rng = mulberry32(seed);
    const gauss = () => (rng() + rng() + rng() - 1.5); // ~N(0, .5)
    const lo = Math.min(...teams.map(t => t.fp));
    const hi = Math.max(...teams.map(t => t.fp));
    const N = teams.length;
    const canon = [...teams].sort((a, b) => (b.fp - a.fp) || (a.id < b.id ? -1 : 1));
    const canonIdx = {}; canon.forEach((t, i) => { canonIdx[t.id] = i; });
    const K = Math.max(3, Math.round(rounds * 0.18));
    const startConv = rounds - K;
    const PULL = (hi - lo) * 3 + 60;
    const state = teams.map(t => ({
      t, s: (t.fp - lo) / Math.max(1, hi - lo), pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pod: 0, hist: []
    }));
    for (let r = 1; r <= rounds; r++) {
      for (const st of state) {
        if (sport === 'f1') {
          const avg = st.t.fp / rounds;
          const v = avg + gauss() * Math.max(3.4, avg * 0.95);
          const pr = Math.max(0, Math.min(26, Math.round(v)));
          st.pts += pr;
          if (pr >= 24) st.w++;
          if (pr >= 15) st.pod++;
        } else {
          let pWin = 0.10 + 0.62 * st.s, pLoss = 0.10 + 0.62 * (1 - st.s);
          if (pWin + pLoss > 0.94) { const k = 0.94 / (pWin + pLoss); pWin *= k; pLoss *= k; }
          const roll = rng(); let gf, ga;
          if (roll < pWin) { st.pts += 3; st.w++; gf = 1 + Math.floor(rng() * 3); ga = Math.floor(rng() * Math.min(gf, 2)); }
          else if (roll < pWin + pLoss) { st.l++; ga = 1 + Math.floor(rng() * 3); gf = Math.floor(rng() * Math.min(ga, 2)); }
          else { st.pts += 1; st.d++; gf = Math.floor(rng() * 2); ga = gf; }
          st.gf += gf; st.ga += ga;
        }
      }
      const f = r <= startConv ? 0 : (r - startConv) / K; // 0..1 convergence ramp
      const ranked = [...state].sort((a, b) => {
        const sa = a.pts + f * PULL * (N - canonIdx[a.t.id]);
        const sb = b.pts + f * PULL * (N - canonIdx[b.t.id]);
        return (sb - sa) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.s - a.s);
      });
      ranked.forEach((st, i) => {
        const h = { round: r, pos: i + 1, pts: st.pts };
        if (sport === 'f1') { h.w = st.w; h.pod = st.pod; }
        else { h.w = st.w; h.d = st.d; h.l = st.l; h.gd = st.gf - st.ga; }
        st.hist.push(h);
      });
    }
    return state.map(st => ({
      id: st.t.id, name: st.t.name, short: st.t.short, color: st.t.color,
      colorKey: st.t.colorKey, dashed: false, cons: st.t.cons || null, sport,
      hist: st.hist, finalPos: st.hist[st.hist.length - 1].pos
    }));
  }

  // Mark dashed lines: any competitor sharing a colorKey with a higher-ranked one.
  function assignDashes(rows) {
    const sorted = [...rows].sort((a, b) => a.finalPos - b.finalPos);
    const seen = new Set();
    for (const row of sorted) {
      if (seen.has(row.colorKey)) row.dashed = true;
      seen.add(row.colorKey);
    }
    return rows;
  }

  // ---- Premier League 2024/25 (distinct vibrant shades; ARS & NFO share a red -> NFO dashes) ----
  const PL_TEAMS = [
    { id: 'liv', name: 'Liverpool', short: 'LIV', color: '#E8112D', colorKey: 'red-deep', fp: 84 },
    { id: 'ars', name: 'Arsenal', short: 'ARS', color: '#FF5A3C', colorKey: 'red-bright', fp: 74 },
    { id: 'mci', name: 'Man City', short: 'MCI', color: '#6CB7EA', colorKey: 'sky', fp: 71 },
    { id: 'che', name: 'Chelsea', short: 'CHE', color: '#2C6BE0', colorKey: 'blue-royal', fp: 69 },
    { id: 'new', name: 'Newcastle', short: 'NEW', color: '#9AA6B6', colorKey: 'silver', fp: 66 },
    { id: 'avl', name: 'Aston Villa', short: 'AVL', color: '#9C2A55', colorKey: 'claret', fp: 66 },
    { id: 'nfo', name: "Nott'm Forest", short: 'NFO', color: '#FF5A3C', colorKey: 'red-bright', fp: 65 },
    { id: 'bha', name: 'Brighton', short: 'BHA', color: '#3D9BE8', colorKey: 'blue-sea', fp: 61 },
    { id: 'bou', name: 'Bournemouth', short: 'BOU', color: '#C2185B', colorKey: 'cherry', fp: 56 },
    { id: 'bre', name: 'Brentford', short: 'BRE', color: '#F0552E', colorKey: 'orange-red', fp: 56 },
    { id: 'ful', name: 'Fulham', short: 'FUL', color: '#D9DEE6', colorKey: 'white', fp: 54 },
    { id: 'cry', name: 'Crystal Palace', short: 'CRY', color: '#3553C4', colorKey: 'blue-ind', fp: 53 },
    { id: 'eve', name: 'Everton', short: 'EVE', color: '#2E5BD6', colorKey: 'blue-toffee', fp: 48 },
    { id: 'whu', name: 'West Ham', short: 'WHU', color: '#7E2440', colorKey: 'claret-h', fp: 43 },
    { id: 'mun', name: 'Man United', short: 'MUN', color: '#D6342A', colorKey: 'red-united', fp: 42 },
    { id: 'wol', name: 'Wolves', short: 'WOL', color: '#F6A21D', colorKey: 'gold', fp: 42 },
    { id: 'tot', name: 'Tottenham', short: 'TOT', color: '#5468B0', colorKey: 'navy', fp: 38 },
    { id: 'lei', name: 'Leicester', short: 'LEI', color: '#2C86E8', colorKey: 'blue-fox', fp: 25 },
    { id: 'ips', name: 'Ipswich', short: 'IPS', color: '#3C72E0', colorKey: 'blue-town', fp: 22 },
    { id: 'sou', name: 'Southampton', short: 'SOU', color: '#E84855', colorKey: 'red-saint', fp: 12 }
  ];

  // ---- F1 2024 — constructors ----
  const F1_CONS = [
    { id: 'mcl', name: 'McLaren', short: 'MCL', color: '#FF7A00', colorKey: 'mcl', fp: 666 },
    { id: 'fer', name: 'Ferrari', short: 'FER', color: '#E8002D', colorKey: 'fer', fp: 652 },
    { id: 'rbr', name: 'Red Bull', short: 'RBR', color: '#3661C9', colorKey: 'rbr', fp: 589 },
    { id: 'mer', name: 'Mercedes', short: 'MER', color: '#21D6BE', colorKey: 'mer', fp: 468 },
    { id: 'amr', name: 'Aston Martin', short: 'AMR', color: '#2B9C74', colorKey: 'amr', fp: 94 },
    { id: 'alp', name: 'Alpine', short: 'ALP', color: '#2FA4E0', colorKey: 'alp', fp: 65 },
    { id: 'haa', name: 'Haas', short: 'HAA', color: '#C2C7CD', colorKey: 'haa', fp: 58 },
    { id: 'vrb', name: 'RB', short: 'RB', color: '#6692FF', colorKey: 'vrb', fp: 46 },
    { id: 'wil', name: 'Williams', short: 'WIL', color: '#5BC2FF', colorKey: 'wil', fp: 17 },
    { id: 'sau', name: 'Sauber', short: 'SAU', color: '#4FD96B', colorKey: 'sau', fp: 4 }
  ];

  // ---- F1 2024 — drivers (teammates share constructor color; 2nd driver dashes) ----
  const F1_DRV = [
    { id: 'ver', name: 'Verstappen', short: 'VER', cons: 'Red Bull', color: '#3661C9', colorKey: 'rbr', fp: 437 },
    { id: 'nor', name: 'Norris', short: 'NOR', cons: 'McLaren', color: '#FF7A00', colorKey: 'mcl', fp: 374 },
    { id: 'lec', name: 'Leclerc', short: 'LEC', cons: 'Ferrari', color: '#E8002D', colorKey: 'fer', fp: 356 },
    { id: 'pia', name: 'Piastri', short: 'PIA', cons: 'McLaren', color: '#FF7A00', colorKey: 'mcl', fp: 292 },
    { id: 'sai', name: 'Sainz', short: 'SAI', cons: 'Ferrari', color: '#E8002D', colorKey: 'fer', fp: 290 },
    { id: 'rus', name: 'Russell', short: 'RUS', cons: 'Mercedes', color: '#21D6BE', colorKey: 'mer', fp: 245 },
    { id: 'ham', name: 'Hamilton', short: 'HAM', cons: 'Mercedes', color: '#21D6BE', colorKey: 'mer', fp: 223 },
    { id: 'per', name: 'Pérez', short: 'PER', cons: 'Red Bull', color: '#3661C9', colorKey: 'rbr', fp: 152 },
    { id: 'alo', name: 'Alonso', short: 'ALO', cons: 'Aston Martin', color: '#2B9C74', colorKey: 'amr', fp: 70 },
    { id: 'gas', name: 'Gasly', short: 'GAS', cons: 'Alpine', color: '#2FA4E0', colorKey: 'alp', fp: 42 },
    { id: 'hul', name: 'Hülkenberg', short: 'HUL', cons: 'Haas', color: '#C2C7CD', colorKey: 'haa', fp: 41 },
    { id: 'tsu', name: 'Tsunoda', short: 'TSU', cons: 'RB', color: '#6692FF', colorKey: 'vrb', fp: 30 },
    { id: 'str', name: 'Stroll', short: 'STR', cons: 'Aston Martin', color: '#2B9C74', colorKey: 'amr', fp: 24 },
    { id: 'oco', name: 'Ocon', short: 'OCO', cons: 'Alpine', color: '#2FA4E0', colorKey: 'alp', fp: 23 },
    { id: 'mag', name: 'Magnussen', short: 'MAG', cons: 'Haas', color: '#C2C7CD', colorKey: 'haa', fp: 16 },
    { id: 'alb', name: 'Albon', short: 'ALB', cons: 'Williams', color: '#5BC2FF', colorKey: 'wil', fp: 12 },
    { id: 'ric', name: 'Ricciardo', short: 'RIC', cons: 'RB', color: '#6692FF', colorKey: 'vrb', fp: 12 },
    { id: 'col', name: 'Colapinto', short: 'COL', cons: 'Williams', color: '#5BC2FF', colorKey: 'wil', fp: 5 },
    { id: 'bot', name: 'Bottas', short: 'BOT', cons: 'Sauber', color: '#4FD96B', colorKey: 'sau', fp: 4 },
    { id: 'zho', name: 'Zhou', short: 'ZHO', cons: 'Sauber', color: '#4FD96B', colorKey: 'sau', fp: 3 }
  ];

  const datasets = {
    pl_2425: {
      id: 'pl_2425', sport: 'soccer', league: 'Premier League', season: '2024/25',
      title: 'Premier League', seasonLabel: '2024/25', subtitle: 'Position after each matchweek',
      icon: 'soccer', rounds: 38, xLabel: 'Matchweek', xAbbr: 'MW', unit: 'pts',
      rows: assignDashes(generateSeason(PL_TEAMS, 38, 20242025, 'soccer'))
    },
    f1_drivers: {
      id: 'f1_drivers', sport: 'f1', league: 'Formula 1', season: '2024',
      title: 'Formula 1', seasonLabel: '2024 · Drivers', subtitle: 'Championship position after each round',
      icon: 'f1', rounds: 24, xLabel: 'Round', xAbbr: 'R', unit: 'pts',
      rows: assignDashes(generateSeason(F1_DRV, 24, 20241, 'f1'))
    },
    f1_constructors: {
      id: 'f1_constructors', sport: 'f1', league: 'Formula 1', season: '2024',
      title: 'Formula 1', seasonLabel: '2024 · Constructors', subtitle: 'Championship position after each round',
      icon: 'f1', rounds: 24, xLabel: 'Round', xAbbr: 'R', unit: 'pts',
      rows: assignDashes(generateSeason(F1_CONS, 24, 20242, 'f1'))
    }
  };

  window.SquiggleData = { datasets, F1_DRV };
})();
