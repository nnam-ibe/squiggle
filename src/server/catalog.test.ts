import { describe, it, expect } from "vitest";
import { buildCatalog, dataKey } from "./catalog";
import { getAllLeagues } from "@/config/leagues";

describe("buildCatalog — merges config with dataset presence", () => {
  // Pretend only Premier League 2025-26 has a persisted dataset.
  const keys = new Set([dataKey("premier-league", "2025-26")]);
  const catalog = buildCatalog(getAllLeagues(), keys);

  it("groups leagues under sports in the configured order", () => {
    expect(catalog.sports.map((s) => s.id)).toEqual(["soccer", "motorsport"]);
    expect(catalog.sports[0]).toMatchObject({ id: "soccer", name: "Soccer", icon: "soccer" });
    expect(catalog.sports[1]).toMatchObject({ id: "motorsport", name: "Motorsport", icon: "f1" });
  });

  it("lists a sport's leagues sorted by name, with country meta where present", () => {
    const soccer = catalog.sports.find((s) => s.id === "soccer")!;
    const names = soccer.leagues.map((l) => l.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const pl = soccer.leagues.find((l) => l.id === "premier-league")!;
    expect(pl.country).toBe("England");
  });

  it("marks only the seasons that have a dataset, newest first", () => {
    const pl = catalog.sports[0].leagues.find((l) => l.id === "premier-league")!;
    // seasons sorted descending
    expect(pl.seasons.map((s) => s.season)).toEqual(
      [...pl.seasons.map((s) => s.season)].sort((a, b) => b.localeCompare(a)),
    );
    const s2526 = pl.seasons.find((s) => s.season === "2025-26")!;
    expect(s2526.hasData).toBe(true);
    expect(s2526.href).toBe("/soccer/premier-league/2025-26");
    // every other (league, season) is unmarked
    for (const sport of catalog.sports) {
      for (const league of sport.leagues) {
        for (const season of league.seasons) {
          if (league.id === "premier-league" && season.season === "2025-26") continue;
          expect(season.hasData).toBe(false);
        }
      }
    }
  });

  it("exposes F1 seasons under motorsport with no country", () => {
    const f1 = catalog.sports.find((s) => s.id === "motorsport")!.leagues.find((l) => l.id === "formula-1")!;
    expect(f1.country).toBeUndefined();
    expect(f1.seasons.map((s) => s.season)).toEqual(expect.arrayContaining(["2024", "2025"]));
    expect(f1.seasons.find((s) => s.season === "2024")!.href).toBe("/motorsport/formula-1/2024");
  });
});
