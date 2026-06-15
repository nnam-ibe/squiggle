import { describe, it, expect } from "vitest";
import { previewSoccerUpload } from "./preview";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";
const base = { leagueId: "premier-league", season: "2024-25" };

describe("previewSoccerUpload", () => {
  it("returns a computed final table ordered by the standings rules", () => {
    const out = previewSoccerUpload({
      csv: csv(
        "1,2025-08-16,Liverpool,Bournemouth,3,0", // Liverpool win
        "1,2025-08-16,Arsenal,Chelsea,1,1", // draw
      ),
      ...base,
    });
    expect(out.ok).toBe(true);
    expect(out.previewTable[0]).toMatchObject({ position: 1, team: "Liverpool", points: 3, gd: 3 });
    const arsenal = out.previewTable.find((r) => r.team === "Arsenal")!;
    expect(arsenal.points).toBe(1);
    // every team that played appears
    expect(out.previewTable.map((r) => r.team).sort()).toEqual(
      ["Arsenal", "Bournemouth", "Chelsea", "Liverpool"].sort(),
    );
  });

  it("carries warnings through on an otherwise-valid upload", () => {
    const out = previewSoccerUpload({ csv: csv("1,2025-08-16,Liverpool,Fake FC,2,0"), ...base });
    expect(out.ok).toBe(true);
    expect(out.warnings.some((w) => w.code === "unknown_team")).toBe(true);
    expect(out.previewTable.length).toBe(2);
  });

  it("returns ok=false and no table for invalid input", () => {
    const out = previewSoccerUpload({ csv: csv("1,2025-08-16,Liverpool,Bournemouth,x,0"), ...base });
    expect(out.ok).toBe(false);
    expect(out.previewTable).toEqual([]);
    expect(out.errors.some((e) => e.code === "bad_row")).toBe(true);
  });
});
