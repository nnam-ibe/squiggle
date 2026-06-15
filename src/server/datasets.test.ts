import { describe, it, expect } from "vitest";
import { getDatasetStandings } from "./datasets";

// These return null from the config check before any DB access — no database needed.
describe("getDatasetStandings — config gate (no DB)", () => {
  it("returns null for an unknown league", async () => {
    expect(await getDatasetStandings({ sport: "soccer", league: "nope", season: "2024-25" })).toBeNull();
  });

  it("returns null when sport doesn't match the league", async () => {
    expect(
      await getDatasetStandings({ sport: "motorsport", league: "premier-league", season: "2024-25" }),
    ).toBeNull();
  });
});
