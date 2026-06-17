/**
 * Seed the verified launch datasets so the homepage isn't empty (CLOUD-31).
 *
 *   node --env-file=.env scripts/seed-datasets.ts          # seed all
 *   node --env-file=.env scripts/seed-datasets.ts --dry    # parse + report only
 *
 * Self-contained (talks to Postgres directly, no app/config imports) so it can run
 * against any environment that provides DATABASE_URL — including production. Each
 * dataset is replaced idempotently. The fixtures are the same real, accuracy-tested
 * seasons used by the engine tests (PL 2025-26 → CLOUD-9, F1 2024 → CLOUD-25), so the
 * standings they render match the official tables.
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

interface LaunchDataset {
  sport: "soccer" | "motorsport";
  leagueId: string;
  season: string;
  fixture: string;
  kind: "soccer" | "f1";
}

const LAUNCH: LaunchDataset[] = [
  { sport: "soccer", leagueId: "premier-league", season: "2025-26", fixture: "premier-league-2025-26.csv", kind: "soccer" },
  { sport: "motorsport", leagueId: "formula-1", season: "2024", fixture: "formula-1-2024.csv", kind: "f1" },
];

const FIX = path.join(process.cwd(), "src/domain/__fixtures__");

type JsonScalar = string | number | boolean | null | undefined;

interface MatchRow {
  round: number;
  playedOn: string;
  payload: Record<string, JsonScalar>;
}

const num = (v: string): number | null => (/^-?\d+$/.test(v.trim()) ? Number(v) : null);

function rows(fixture: string): string[][] {
  const csv = fs.readFileSync(path.join(FIX, fixture), "utf8");
  const [, ...lines] = csv.trim().split("\n");
  return lines.map((l) => l.split(",").map((c) => c.trim()));
}

function parseSoccer(fixture: string): MatchRow[] {
  // round,date,home_team,away_team,home_goals,away_goals
  return rows(fixture).map(([round, date, home, away, hg, ag]) => ({
    round: Number(round),
    playedOn: date,
    payload: { home_team: home, away_team: away, home_goals: Number(hg), away_goals: Number(ag) },
  }));
}

function parseF1(fixture: string): MatchRow[] {
  // round,date,race,driver,constructor,finish_position,fastest_lap,sprint_position
  return rows(fixture).map(([round, date, race, driver, constructor, finish, fl, sprint]) => ({
    round: Number(round),
    playedOn: date,
    payload: {
      race: race || undefined,
      driver,
      constructor,
      finish_position: num(finish),
      fastest_lap: fl === "true",
      sprint_position: sprint === "" ? null : num(sprint),
    },
  }));
}

async function main() {
  const dry = process.argv.includes("--dry");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (e.g. node --env-file=.env scripts/seed-datasets.ts)");
    process.exit(1);
  }
  const sql = postgres(url, { ssl: "require", max: 1 });

  try {
    for (const d of LAUNCH) {
      const matches = d.kind === "soccer" ? parseSoccer(d.fixture) : parseF1(d.fixture);
      const roundsPresent = new Set(matches.map((m) => m.round)).size;
      console.log(`${d.leagueId} ${d.season}: ${matches.length} rows, ${roundsPresent} rounds${dry ? " (dry run)" : ""}`);
      if (dry) continue;

      await sql.begin(async (tx) => {
        await tx`delete from datasets where league_id = ${d.leagueId} and season = ${d.season}`;
        const [ds] = await tx`
          insert into datasets (sport, league_id, season, source_filename, row_count, rounds_present, is_complete)
          values (${d.sport}, ${d.leagueId}, ${d.season}, ${d.fixture}, ${matches.length}, ${roundsPresent}, ${true})
          returning id`;
        for (const m of matches) {
          await tx`
            insert into matches (dataset_id, round, played_on, payload)
            values (${ds.id}, ${m.round}, ${m.playedOn}, ${tx.json(m.payload)})`;
        }
      });
      console.log(`  ✓ seeded /${d.sport}/${d.leagueId}/${encodeURIComponent(d.season)}`);
    }

    const present = await sql`select league_id, season from datasets order by league_id, season`;
    console.log(`\nDatasets now in DB (${present.length}):`, present.map((r) => `${r.league_id} ${r.season}`).join(", "));
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
