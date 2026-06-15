import { describe, it, expect } from "vitest";
import { commitSoccerUpload, type CommitInput } from "./commit";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";

// A db that fails loudly if touched — proves the invalid paths never persist.
const explodingDb = {
  transaction() {
    throw new Error("DB must not be touched on validation failure");
  },
} as unknown as CommitInput["db"];

describe("commitSoccerUpload — does not persist invalid uploads", () => {
  it("returns 400 (no DB) for a bad row", async () => {
    const res = await commitSoccerUpload({
      csv: csv("1,2025-08-16,Liverpool,Bournemouth,x,0"),
      leagueId: "premier-league",
      season: "2024-25",
      db: explodingDb,
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.errors.some((e) => e.code === "bad_row")).toBe(true);
  });

  it("returns 400 (no DB) for an unknown league", async () => {
    const res = await commitSoccerUpload({
      csv: csv("1,2025-08-16,A,B,1,0"),
      leagueId: "nope",
      season: "2024-25",
      db: explodingDb,
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });
});
