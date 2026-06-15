import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { computeStandings } from "./standings";
import { createSoccerAdapter } from "./sports/soccer";
import { getLeague, getTieBreakers } from "@/config/leagues";
import type { NormalizedResult } from "./types";
import type { TieBreaker } from "@/config/schema";

/**
 * Accuracy test: run the engine over a full real season (Premier League 2025/26,
 * football-data.co.uk results converted to the template) and assert its final
 * table matches an INDEPENDENT, trivially-correct reference computation.
 *
 * Since the converted results ARE the official match results, the reference table
 * IS the official final table — so engine == reference ⇒ engine == official.
 */

interface Row {
  round: number;
  date: string;
  home: string;
  away: string;
  hg: number;
  ag: number;
}

function loadFixture(): Row[] {
  const csv = fs.readFileSync(
    path.join(process.cwd(), "src/domain/__fixtures__/premier-league-2025-26.csv"),
    "utf8",
  );
  const [, ...lines] = csv.trim().split("\n");
  return lines.map((line) => {
    const [round, date, home, away, hg, ag] = line.split(",");
    return { round: Number(round), date, home, away, hg: Number(hg), ag: Number(ag) };
  });
}

/** Independent reference table: points (3/1/0), then GD, goals for, name. */
function referenceTable(rows: Row[]) {
  const t = new Map<string, { name: string; pts: number; gf: number; ga: number; played: number }>();
  const get = (name: string) => {
    let r = t.get(name);
    if (!r) {
      r = { name, pts: 0, gf: 0, ga: 0, played: 0 };
      t.set(name, r);
    }
    return r;
  };
  for (const m of rows) {
    const h = get(m.home);
    const a = get(m.away);
    h.played++;
    a.played++;
    h.gf += m.hg;
    h.ga += m.ag;
    a.gf += m.ag;
    a.ga += m.hg;
    if (m.hg > m.ag) h.pts += 3;
    else if (m.hg < m.ag) a.pts += 3;
    else {
      h.pts += 1;
      a.pts += 1;
    }
  }
  return [...t.values()]
    .map((x) => ({ team: x.name, points: x.pts, gd: x.gf - x.ga, gf: x.gf, played: x.played }))
    .sort((p, q) => q.points - p.points || q.gd - p.gd || q.gf - p.gf || p.team.localeCompare(q.team))
    .map((x, i) => ({ position: i + 1, team: x.team, points: x.points, gd: x.gd }));
}

describe("standings engine accuracy — Premier League 2025/26 (real season)", () => {
  const rows = loadFixture();
  const league = getLeague("premier-league");
  if (!league || league.sport !== "soccer") throw new Error("premier-league config missing");
  const adapter = createSoccerAdapter(league.format);
  const tieBreakers = getTieBreakers("premier-league") as TieBreaker[];

  const results: NormalizedResult[] = rows.map((m) => ({
    round: m.round,
    playedOn: m.date,
    homeTeam: m.home,
    awayTeam: m.away,
    homeGoals: m.hg,
    awayGoals: m.ag,
  }));

  const standings = computeStandings({ results, entityType: "team", tieBreakers, adapter });
  const final = standings.rounds.at(-1)!.standings;
  const engineTable = final.map((s) => ({
    position: s.position,
    team: s.entity,
    points: s.points,
    gd: s.stats.gd,
  }));

  it("covers the whole season (20 teams, 38 rounds, 38 games each)", () => {
    expect(standings.rounds).toHaveLength(38);
    expect(final).toHaveLength(20);
    for (const s of final) expect(s.stats.played).toBe(38);
  });

  it("final table (position, points, GD) matches the independent reference", () => {
    expect(engineTable).toEqual(referenceTable(rows));
  });

  it("satisfies league-table invariants", () => {
    // positions are 1..20, unique
    expect(engineTable.map((r) => r.position)).toEqual([...Array(20)].map((_, i) => i + 1));
    // points strictly non-increasing down the table
    for (let i = 1; i < engineTable.length; i++) {
      expect(engineTable[i].points).toBeLessThanOrEqual(engineTable[i - 1].points);
    }
    // goals scored across the league equals goals conceded → total GD sums to 0
    expect(engineTable.reduce((sum, r) => sum + r.gd, 0)).toBe(0);
    // tie-break: equal points ⇒ GD non-increasing
    for (let i = 1; i < engineTable.length; i++) {
      if (engineTable[i].points === engineTable[i - 1].points) {
        expect(engineTable[i].gd).toBeLessThanOrEqual(engineTable[i - 1].gd);
      }
    }
  });
});
