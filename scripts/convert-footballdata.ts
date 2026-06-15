/**
 * CLI: convert a football-data.co.uk soccer CSV into the Squiggle template.
 *
 *   node scripts/convert-footballdata.ts <input.csv> --league premier-league \
 *        --season 2025-26 [--out path.csv]
 *
 * Derives the round, aliases team names, and validates the result against the
 * league/season roster (warns on names that don't resolve). Writes a template CSV.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { convertFootballData, toTemplateCsv, DEFAULT_PL_ALIASES } from "../src/upload/footballdata.ts";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const input = process.argv[2];
const league = arg("--league");
const season = arg("--season");
const explicitOut = arg("--out");

if (!input || !league || !season) {
  console.error("Usage: node scripts/convert-footballdata.ts <input.csv> --league <id> --season <season> [--out <path>]");
  process.exit(1);
}

const csv = fs.readFileSync(input, "utf8");
const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: "greedy" });
const { rows, teams, rounds, skipped } = convertFootballData(parsed.data, { aliases: DEFAULT_PL_ALIASES });

// Validate resolved names against the league/season roster.
const cfgPath = path.join(process.cwd(), "data", "leagues", `${league}.json`);
let unknown: string[] = [];
if (fs.existsSync(cfgPath)) {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const roster: string[] = (cfg.seasons?.[season]?.teams ?? []).map((t: { name: string }) => t.name);
  if (roster.length) {
    const known = new Set(roster);
    unknown = teams.filter((t) => !known.has(t));
  }
} else {
  console.error(`! No config at ${cfgPath}; skipping roster validation.`);
}

const out =
  explicitOut ?? path.join(path.dirname(input), `${league}-${season}.template.csv`);
fs.writeFileSync(out, toTemplateCsv(rows));

console.error(`✓ Wrote ${rows.length} matches across ${rounds} rounds (${teams.length} teams) to:`);
console.error(`  ${out}`);
if (skipped) console.error(`! Skipped ${skipped} rows with missing/invalid fields.`);
if (unknown.length) {
  console.error(`! ${unknown.length} team name(s) not in the ${league} ${season} roster (add an alias for on-brand colors):`);
  for (const t of unknown) console.error(`    - ${t}`);
} else {
  console.error(`✓ All team names resolve to the ${league} ${season} roster.`);
}
