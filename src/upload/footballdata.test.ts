import { describe, it, expect } from "vitest";
import { toIsoDate, convertFootballData, toTemplateCsv } from "./footballdata";

describe("toIsoDate", () => {
  it("passes ISO through and converts dd/mm/yy[yy]", () => {
    expect(toIsoDate("2025-08-16")).toBe("2025-08-16");
    expect(toIsoDate("16/08/25")).toBe("2025-08-16");
    expect(toIsoDate("16/08/2025")).toBe("2025-08-16");
  });
});

describe("convertFootballData", () => {
  const row = (Date: string, HomeTeam: string, AwayTeam: string, FTHG: string, FTAG: string) => ({
    Date,
    HomeTeam,
    AwayTeam,
    FTHG,
    FTAG,
    FTR: "",
  });

  it("maps columns, aliases names, and derives per-team game-count rounds", () => {
    // 3 teams (A, B, C) over 3 dates → A,B play first (round 1 for both),
    // then C enters.
    const { rows, teams, rounds, skipped } = convertFootballData([
      row("2025-08-16", "Man City", "Wolves", "4", "0"), // round 1 (City #1, Wolves #1)
      row("2025-08-16", "Leeds", "Newcastle", "1", "1"), // round 1 (Leeds #1, Newcastle #1)
      row("2025-08-23", "Wolves", "Leeds", "2", "2"), // round 2 (Wolves #2, Leeds #2)
      row("2025-08-23", "Man City", "Newcastle", "3", "1"), // round 2
    ]);
    expect(skipped).toBe(0);
    expect(rounds).toBe(2);
    // aliasing applied
    expect(teams).toContain("Manchester City");
    expect(teams).toContain("Wolverhampton Wanderers");
    expect(teams).toContain("Leeds United");
    expect(teams).toContain("Newcastle United");
    const r1 = rows.filter((r) => r.round === 1);
    expect(r1).toHaveLength(2);
    expect(rows.find((r) => r.home_team === "Manchester City" && r.round === 1)).toMatchObject({
      away_team: "Wolverhampton Wanderers",
      home_goals: 4,
      away_goals: 0,
    });
  });

  it("skips rows with missing/invalid essential fields", () => {
    const { rows, skipped } = convertFootballData([
      row("2025-08-16", "Arsenal", "Chelsea", "1", "0"),
      row("2025-08-16", "Arsenal", "", "1", "0"), // missing away
      row("not-a-date", "Arsenal", "Chelsea", "1", "0"), // bad date
      row("2025-08-16", "Arsenal", "Chelsea", "x", "0"), // bad score
    ]);
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(3);
  });

  it("emits a valid template CSV header", () => {
    const csv = toTemplateCsv([
      { round: 1, date: "2025-08-16", home_team: "Arsenal", away_team: "Chelsea", home_goals: 1, away_goals: 0 },
    ]);
    expect(csv.split("\n")[0]).toBe("round,date,home_team,away_team,home_goals,away_goals");
    expect(csv).toContain("1,2025-08-16,Arsenal,Chelsea,1,0");
  });
});
