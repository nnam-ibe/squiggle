import { parseResultsCsv } from "./parse";
import { getLeague, getSeasonRoster } from "@/config/leagues";
import { createSoccerAdapter } from "@/domain/sports/soccer";
import type { NormalizedResult } from "@/domain/types";

export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_ROWS = 5000;

const SOCCER_REQUIRED_COLUMNS = [
  "round",
  "date",
  "home_team",
  "away_team",
  "home_goals",
  "away_goals",
];

export interface ValidationIssue {
  code: string;
  message: string;
  row?: number;
  field?: string;
}

export interface ValidationOutcome {
  ok: boolean; // true when there are no errors (warnings are allowed)
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  results: NormalizedResult[];
  rowCount: number;
  roundsPresent: number;
  isComplete: boolean;
  unknownEntities: string[];
}

export interface SoccerUploadInput {
  csv: string;
  leagueId: string;
  season: string;
  /** Optional byte size (e.g. from the upload). Falls back to the CSV's own size. */
  byteSize?: number;
}

function fail(errors: ValidationIssue[]): ValidationOutcome {
  return {
    ok: false,
    errors,
    warnings: [],
    results: [],
    rowCount: 0,
    roundsPresent: 0,
    isComplete: false,
    unknownEntities: [],
  };
}

/**
 * Validate a soccer results upload. Hard errors block saving; warnings don't.
 * Unknown teams are warn-only (hybrid validation): they get auto-colored later.
 */
export function validateSoccerUpload(input: SoccerUploadInput): ValidationOutcome {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const league = getLeague(input.leagueId);
  if (!league) {
    return fail([{ code: "unknown_league", message: `Unknown league "${input.leagueId}"` }]);
  }
  if (league.sport !== "soccer") {
    return fail([
      { code: "wrong_sport", message: `League "${input.leagueId}" is not a soccer league` },
    ]);
  }

  const bytes = input.byteSize ?? Buffer.byteLength(input.csv, "utf8");
  if (bytes > MAX_BYTES) {
    errors.push({
      code: "file_too_large",
      message: `File is ${bytes} bytes; limit is ${MAX_BYTES} (2 MB)`,
    });
  }

  const adapter = createSoccerAdapter(league.format);
  const { results, errors: rowErrors, rowCount, fields } = parseResultsCsv(input.csv, adapter);

  if (rowCount > MAX_ROWS) {
    errors.push({ code: "too_many_rows", message: `${rowCount} rows; limit is ${MAX_ROWS}` });
  }

  const present = new Set(fields.map((f) => f.trim().toLowerCase()));
  const missing = SOCCER_REQUIRED_COLUMNS.filter((c) => !present.has(c));
  if (missing.length) {
    errors.push({ code: "missing_columns", message: `Missing required columns: ${missing.join(", ")}` });
  }

  for (const e of rowErrors) {
    errors.push({ code: "bad_row", message: e.message, row: e.row, field: e.field });
  }

  // --- Warnings ---

  const roster = getSeasonRoster(input.leagueId, input.season);
  const unknown = new Set<string>();
  if (!roster) {
    warnings.push({
      code: "no_roster",
      message: `No roster configured for ${input.leagueId} ${input.season}; team names not validated`,
    });
  } else {
    const known = new Set(roster.map((t) => t.name));
    for (const r of results) {
      if (r.homeTeam && !known.has(r.homeTeam)) unknown.add(r.homeTeam);
      if (r.awayTeam && !known.has(r.awayTeam)) unknown.add(r.awayTeam);
    }
    for (const name of unknown) {
      warnings.push({ code: "unknown_team", message: `Unknown team "${name}" (will be auto-colored)` });
    }
  }

  const rounds = new Set(results.map((r) => r.round));
  const roundsPresent = rounds.size ? Math.max(...rounds) : 0;
  const isComplete = roundsPresent >= league.format.rounds;
  if (results.length && !isComplete) {
    warnings.push({
      code: "partial_season",
      message: `Only ${roundsPresent} of ${league.format.rounds} rounds present (in-progress season)`,
    });
  }

  const seen = new Map<string, number>();
  for (const r of results) {
    const key = `${r.round}|${r.homeTeam}|${r.awayTeam}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      const [round, home, away] = key.split("|");
      warnings.push({
        code: "duplicate_fixture",
        message: `Duplicate fixture in round ${round}: ${home} vs ${away} (${count}×)`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    results,
    rowCount,
    roundsPresent,
    isComplete,
    unknownEntities: [...unknown],
  };
}
