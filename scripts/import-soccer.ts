/**
 * Import a Squiggle soccer template CSV as a dataset (CLOUD-43).
 *
 *   node --env-file=.env.production scripts/import-soccer.ts <template.csv> \
 *        --league premier-league --season 2011-12 [--dry]
 *
 * The template is the output of `convert:footballdata`
 * (columns: round,date,home_team,away_team,home_goals,away_goals). This persists it
 * directly to whatever DATABASE_URL points to (use --env-file to target prod), so a
 * batch of converted seasons can be loaded without clicking through the UI for each.
 * Re-running replaces the (league, season) dataset idempotently, like `seed`.
 *
 * Self-contained (talks to Postgres directly) so it runs against any environment.
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

interface MatchRow {
  round: number;
  playedOn: string;
  payload: { home_team: string; away_team: string; home_goals: number; away_goals: number };
}

function parseTemplate(csv: string): MatchRow[] {
  const [header, ...lines] = csv.trim().split("\n");
  const cols = header.split(",").map((c) => c.trim().toLowerCase());
  const idx = (name: string) => cols.indexOf(name);
  for (const req of ["round", "date", "home_team", "away_team", "home_goals", "away_goals"]) {
    if (idx(req) === -1) throw new Error(`Template missing required column: ${req}`);
  }
  return lines.map((line) => {
    const c = line.split(",");
    return {
      round: Number(c[idx("round")]),
      playedOn: c[idx("date")].trim(),
      payload: {
        home_team: c[idx("home_team")].trim(),
        away_team: c[idx("away_team")].trim(),
        home_goals: Number(c[idx("home_goals")]),
        away_goals: Number(c[idx("away_goals")]),
      },
    };
  });
}

function leagueRounds(leagueId: string): number {
  const cfgPath = path.join(process.cwd(), "data", "leagues", `${leagueId}.json`);
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  return cfg.format?.rounds ?? 0;
}

async function main() {
  const input = process.argv[2];
  const league = arg("--league");
  const season = arg("--season");
  const dry = process.argv.includes("--dry");
  if (!input || !league || !season || input.startsWith("--")) {
    console.error("Usage: node --env-file=.env scripts/import-soccer.ts <template.csv> --league <id> --season <YYYY-YY> [--dry]");
    process.exit(1);
  }

  const rows = parseTemplate(fs.readFileSync(input, "utf8"));
  const roundsPresent = rows.length ? Math.max(...rows.map((r) => r.round)) : 0;
  const isComplete = roundsPresent >= leagueRounds(league);
  console.log(`${league} ${season}: ${rows.length} matches, ${roundsPresent} rounds, complete=${isComplete}`);
  if (dry) {
    console.log("Dry run — not writing.");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (e.g. node --env-file=.env.production scripts/import-soccer.ts …)");
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
  try {
    await sql.begin(async (tx) => {
      await tx`delete from datasets where league_id = ${league} and season = ${season}`;
      const [ds] = await tx`
        insert into datasets (sport, league_id, season, source_filename, row_count, rounds_present, is_complete)
        values ('soccer', ${league}, ${season}, ${path.basename(input)}, ${rows.length}, ${roundsPresent}, ${isComplete})
        returning id`;
      // Bulk insert all matches in one statement (per-row round-trips are too slow
      // against a remote pooler).
      const values = rows.map((m) => ({
        dataset_id: ds.id,
        round: m.round,
        played_on: m.playedOn,
        payload: tx.json(m.payload),
      }));
      await tx`insert into matches ${tx(values, "dataset_id", "round", "played_on", "payload")}`;
    });
    console.log(`  ✓ imported /soccer/${league}/${encodeURIComponent(season)}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
