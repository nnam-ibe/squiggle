/**
 * CLOUD-38 SPIKE — proof of concept: fetch a season of F1 results from the Jolpica
 * API (the Ergast-compatible successor) and map it onto our internal F1 row shape
 * (round, date, race, driver, constructor, finish_position, fastest_lap,
 * sprint_position), then validate against the accuracy-tested seed fixture.
 *
 *   node scripts/poc-f1-fetch.ts            # fetch 2024, map, validate vs fixture
 *   node scripts/poc-f1-fetch.ts --write    # also write the mapped CSV to scratchpad
 *
 * This is a throwaway spike artifact, not production code — it proves the source +
 * the mapping. Productionising (adapter, caching, storage) is scoped as follow-ups.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- spike: consumes loosely-typed
   external Ergast/Jolpica JSON; the production adapter (follow-up) would type it. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = "https://api.jolpi.ca/ergast/f1";
const SEASON = 2024;
const FIXTURE = path.join(process.cwd(), "src/domain/__fixtures__/formula-1-2024.csv");

// Jolpica/Ergast constructor names → the branding our seed fixtures use.
const CTOR_NAME: Record<string, string> = {
  "Red Bull": "Red Bull Racing",
  "RB F1 Team": "RB",
  Sauber: "Kick Sauber",
  "Alpine F1 Team": "Alpine",
  "Haas F1 Team": "Haas",
};
const mapCtor = (name: string) => CTOR_NAME[name] ?? name;

type Json = Record<string, any>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getMRData(url: string): Promise<Json> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 429 && attempt < 4) {
      await sleep(1500 * (attempt + 1)); // be polite to a volunteer-run API
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return (await res.json()).MRData;
  }
}

/** Paginate an Ergast list endpoint, returning every Race element (merged by round). */
async function fetchRaces(kind: "results" | "sprint"): Promise<Map<string, Json>> {
  const byRound = new Map<string, Json>();
  let offset = 0;
  const limit = 100;
  for (;;) {
    const mr = await getMRData(`${BASE}/${SEASON}/${kind}/?limit=${limit}&offset=${offset}&format=json`);
    const races: Json[] = mr.RaceTable.Races ?? [];
    for (const race of races) {
      const existing = byRound.get(race.round);
      const list = race.Results ?? race.SprintResults ?? [];
      if (existing) {
        (existing.Results ?? existing.SprintResults).push(...list);
      } else {
        byRound.set(race.round, race);
      }
    }
    offset += limit;
    if (offset >= Number(mr.total)) break;
    await sleep(300);
  }
  return byRound;
}

interface Row {
  round: number;
  date: string;
  race: string;
  driver: string;
  constructor: string;
  finish_position: string;
  fastest_lap: string;
  sprint_position: string;
}

async function main() {
  const write = process.argv.includes("--write");
  console.log(`Fetching ${SEASON} from Jolpica (${BASE}) …`);

  const sprintByRound = await fetchRaces("sprint");
  // round -> driverId -> sprint finishing position
  const sprintPos = new Map<string, Map<string, number>>();
  for (const [round, race] of sprintByRound) {
    const m = new Map<string, number>();
    for (const s of race.SprintResults ?? []) m.set(s.Driver.driverId, Number(s.position));
    sprintPos.set(round, m);
  }
  console.log(`  sprint weekends: ${sprintByRound.size}`);

  const resultsByRound = await fetchRaces("results");
  console.log(`  race rounds: ${resultsByRound.size}`);

  const rows: Row[] = [];
  const apiCtors = new Set<string>();
  for (const round of [...resultsByRound.keys()].sort((a, b) => Number(a) - Number(b))) {
    const race = resultsByRound.get(round)!;
    const sp = sprintPos.get(round);
    for (const r of race.Results ?? []) {
      apiCtors.add(r.Constructor.name);
      rows.push({
        round: Number(race.round),
        date: race.date,
        race: race.raceName,
        driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
        constructor: mapCtor(r.Constructor.name),
        // positionText is numeric for a classified finish, a letter (R/D/E/W/F/N)
        // for a retirement/DSQ — map the latter to "DNF" like our fixtures do.
        finish_position: /^\d+$/.test(r.positionText) ? r.positionText : "DNF",
        fastest_lap: r.FastestLap?.rank === "1" ? "true" : "false",
        sprint_position: sp?.has(r.Driver.driverId) ? String(sp.get(r.Driver.driverId)) : "",
      });
    }
  }
  console.log(`  mapped rows: ${rows.length}`);

  if (write) {
    const header = "round,date,race,driver,constructor,finish_position,fastest_lap,sprint_position";
    const body = rows.map((r) => Object.values(r).join(",")).join("\n");
    const dest = path.join(os.tmpdir(), "poc-f1-2024.csv");
    fs.writeFileSync(dest, `${header}\n${body}\n`);
    console.log(`  wrote ${dest}`);
  }

  validate(rows, apiCtors);
}

function validate(rows: Row[], apiCtors: Set<string>) {
  console.log(`\n── validation vs fixture ──`);
  const fx = fs.readFileSync(FIXTURE, "utf8").trim().split("\n").slice(1);
  const fxRows = fx.map((l) => {
    const [round, date, , driver, ctor, finish, fl, sprint] = l.split(",");
    return { round, date, driver, ctor, finish, fl, sprint };
  });

  // 1. counts
  const fxRounds = new Set(fxRows.map((r) => r.round)).size;
  const apiRounds = new Set(rows.map((r) => String(r.round))).size;
  console.log(`rounds:  fixture ${fxRounds}  api ${apiRounds}  ${fxRounds === apiRounds ? "✓" : "✗"}`);
  console.log(`rows:    fixture ${fxRows.length}  api ${rows.length}  ${fxRows.length === rows.length ? "✓" : "✗"}`);

  // 2. per-round winners
  const fxWin = new Map(fxRows.filter((r) => r.finish === "1").map((r) => [r.round, r.driver]));
  let winOk = 0;
  for (const [round, driver] of fxWin) {
    if (rows.find((r) => String(r.round) === round && r.finish_position === "1")?.driver === driver) winOk++;
  }
  console.log(`winners: ${winOk}/${fxWin.size} rounds match ${winOk === fxWin.size ? "✓" : "✗"}`);

  // 3. per-(round,driver) finishing position agreement
  const apiKey = new Map(rows.map((r) => [`${r.round}|${r.driver}`, r.finish_position]));
  let posOk = 0;
  const posMiss: string[] = [];
  for (const r of fxRows) {
    const got = apiKey.get(`${r.round}|${r.driver}`);
    if (got === r.finish) posOk++;
    else posMiss.push(`R${r.round} ${r.driver}: fixture ${r.finish} vs api ${got ?? "—"}`);
  }
  console.log(`finish positions: ${posOk}/${fxRows.length} match ${posOk === fxRows.length ? "✓" : "✗"}`);
  if (posMiss.length) console.log("  first mismatches:\n   " + posMiss.slice(0, 6).join("\n   "));

  // 4. fastest-lap agreement
  const apiFl = new Map(rows.map((r) => [`${r.round}|${r.driver}`, r.fastest_lap]));
  let flMiss = 0;
  for (const r of fxRows) if (apiFl.get(`${r.round}|${r.driver}`) !== r.fl) flMiss++;
  console.log(`fastest_lap: ${fxRows.length - flMiss}/${fxRows.length} match ${flMiss === 0 ? "✓" : "✗"}`);

  // 5. constructor name reconciliation
  const fxCtors = new Set(fxRows.map((r) => r.ctor));
  const mappedApi = new Set([...apiCtors].map(mapCtor));
  const unmapped = [...mappedApi].filter((c) => !fxCtors.has(c));
  console.log(`constructors: api(mapped) ${[...mappedApi].sort().join(", ")}`);
  console.log(`  unmapped vs fixture: ${unmapped.length ? unmapped.join(", ") : "none ✓"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
