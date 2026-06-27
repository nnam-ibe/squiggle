/**
 * Fetch an F1 season from the Jolpica API and persist it as a dataset (CLOUD-39).
 *
 *   node --env-file=.env scripts/fetch-f1.ts --season 2024
 *   node scripts/fetch-f1.ts --season 2024 --dry        # fetch + report, no DB write
 *
 * The source/mapping is proven in CLOUD-38 (scripts/poc-f1-fetch.ts) and unit-tested
 * in src/domain/sources/jolpica-f1.test.ts. This is the production trigger: an
 * admin-run batch job (Jolpica has no auth and rate limits, and completed seasons are
 * immutable, so a CLI fits better than on-demand frontend fetching). Re-running
 * replaces the season's dataset idempotently, like `seed`.
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { fetchF1Season } from "../src/domain/sources/jolpica-f1.ts";

const LEAGUE_ID = "formula-1";
const SPORT = "motorsport";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

interface SeasonCfg {
  status?: string;
  constructors?: { name: string }[];
}

function loadSeasonConfig(season: string): SeasonCfg {
  const cfgPath = path.join(process.cwd(), "data", "leagues", `${LEAGUE_ID}.json`);
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const seasonCfg = cfg.seasons?.[season];
  if (!seasonCfg) throw new Error(`No ${LEAGUE_ID} season "${season}" in ${cfgPath}`);
  return seasonCfg;
}

async function main() {
  const season = arg("--season");
  const dry = process.argv.includes("--dry");
  if (!season) {
    console.error("Usage: node --env-file=.env scripts/fetch-f1.ts --season <year> [--dry]");
    process.exit(1);
  }

  const seasonCfg = loadSeasonConfig(season);
  const validConstructors = new Set((seasonCfg.constructors ?? []).map((c) => c.name));
  const isComplete = seasonCfg.status === "complete";

  console.log(`Fetching Formula 1 ${season} from Jolpica …`);
  const rows = await fetchF1Season(Number(season), { validConstructors });
  const roundsPresent = new Set(rows.map((r) => r.round)).size;
  console.log(`  ${rows.length} rows across ${roundsPresent} rounds (complete: ${isComplete})`);

  if (dry) {
    console.log("Dry run — not writing to the database.");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (e.g. node --env-file=.env scripts/fetch-f1.ts --season 2024)");
    process.exit(1);
  }
  const sql = postgres(url, { ssl: "require", max: 1 });
  try {
    await sql.begin(async (tx) => {
      await tx`delete from datasets where league_id = ${LEAGUE_ID} and season = ${season}`;
      const [ds] = await tx`
        insert into datasets (sport, league_id, season, source_filename, row_count, rounds_present, is_complete)
        values (${SPORT}, ${LEAGUE_ID}, ${season}, ${`jolpica:f1/${season}`}, ${rows.length}, ${roundsPresent}, ${isComplete})
        returning id`;
      for (const m of rows) {
        await tx`
          insert into matches (dataset_id, round, played_on, payload)
          values (${ds.id}, ${m.round}, ${m.playedOn}, ${tx.json(m.payload)})`;
      }
    });
    console.log(`  ✓ persisted /${SPORT}/${LEAGUE_ID}/${encodeURIComponent(season)}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
