import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseResultsCsv } from "./parse";
import { createSoccerAdapter } from "@/domain/sports/soccer";

const adapter = createSoccerAdapter({ pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0 });

describe("parseResultsCsv (soccer)", () => {
  it("parses the bundled soccer template with no errors", () => {
    const csv = fs.readFileSync(
      path.join(process.cwd(), "data/templates/soccer-results-template.csv"),
      "utf8",
    );
    const { results, errors, rowCount } = parseResultsCsv(csv, adapter);
    expect(errors).toEqual([]);
    expect(rowCount).toBe(4);
    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({
      round: 1,
      playedOn: "2025-08-16",
      homeTeam: "Liverpool",
      awayTeam: "Bournemouth",
      homeGoals: 2,
      awayGoals: 0,
    });
  });

  it("is case-insensitive on headers", () => {
    const csv = "Round,Date,Home_Team,Away_Team,Home_Goals,Away_Goals\n1,2025-08-16,A,B,1,0\n";
    const { results, errors } = parseResultsCsv(csv, adapter);
    expect(errors).toEqual([]);
    expect(results).toHaveLength(1);
    expect(results[0].homeTeam).toBe("A");
  });

  it("returns structured {row, field, message} errors for bad rows", () => {
    const csv = [
      "round,date,home_team,away_team,home_goals,away_goals",
      "1,2025-08-16,A,B,2,0", // ok -> row 1
      "1,2025-13-40,C,D,1,1", // bad date -> row 2
      "1,2025-08-16,E,F,x,0", // non-numeric goals -> row 3
      "2,2025-08-23,,H,1,0", // missing home_team -> row 4
    ].join("\n");

    const { results, errors } = parseResultsCsv(csv, adapter);
    expect(results).toHaveLength(1); // only the first row is valid

    const byField = Object.fromEntries(errors.map((e) => [e.field, e]));
    expect(byField["date"]).toMatchObject({ row: 2, field: "date" });
    expect(byField["home_goals"]).toMatchObject({ row: 3, field: "home_goals" });
    expect(byField["home_team"]).toMatchObject({ row: 4, field: "home_team" });
    for (const e of errors) expect(typeof e.message).toBe("string");
  });

  it("skips blank lines rather than erroring on them", () => {
    const csv = "round,date,home_team,away_team,home_goals,away_goals\n1,2025-08-16,A,B,1,0\n\n   \n";
    const { results, errors } = parseResultsCsv(csv, adapter);
    expect(errors).toEqual([]);
    expect(results).toHaveLength(1);
  });
});
