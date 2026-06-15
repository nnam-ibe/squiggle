import { validateSoccerUpload, type SoccerUploadInput, type ValidationOutcome } from "./validate";
import { getLeague } from "@/config/leagues";
import { createSoccerAdapter } from "@/domain/sports/soccer";
import { computeStandings } from "@/domain/standings";

export interface PreviewRow {
  position: number;
  team: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
}

export interface PreviewResult extends ValidationOutcome {
  /** Final-round standings table; empty when validation failed. */
  previewTable: PreviewRow[];
}

/**
 * Validate a soccer upload and, when valid, compute the final standings table for
 * preview. Persists nothing. `ok` is false (with errors) for invalid uploads.
 */
export function previewSoccerUpload(input: SoccerUploadInput): PreviewResult {
  const outcome = validateSoccerUpload(input);
  if (!outcome.ok) return { ...outcome, previewTable: [] };

  const league = getLeague(input.leagueId);
  if (!league || league.sport !== "soccer") return { ...outcome, previewTable: [] };

  const adapter = createSoccerAdapter(league.format);
  const standings = computeStandings({
    results: outcome.results,
    entityType: "team",
    tieBreakers: league.tieBreakers,
    adapter,
  });

  const final = standings.rounds.at(-1)?.standings ?? [];
  const previewTable: PreviewRow[] = final.map((s) => ({
    position: s.position,
    team: s.entity,
    points: s.points,
    played: s.stats.played ?? 0,
    won: s.stats.won ?? 0,
    drawn: s.stats.drawn ?? 0,
    lost: s.stats.lost ?? 0,
    gf: s.stats.gf ?? 0,
    ga: s.stats.ga ?? 0,
    gd: s.stats.gd ?? 0,
  }));

  return { ...outcome, previewTable };
}
