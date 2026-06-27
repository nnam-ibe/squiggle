import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fetchF1Season, mapConstructorName, F1_CONSTRUCTOR_ALIASES } from "./jolpica-f1";
import { getSeasonRoster } from "@/config/leagues";

// ── Stubbed Ergast/Jolpica responses (offline; no network) ───────────────────────
const driver = (id: string, given: string, family: string) => ({ driverId: id, givenName: given, familyName: family });

const RESULTS = {
  total: "7",
  RaceTable: {
    Races: [
      {
        round: "1",
        date: "2024-03-02",
        raceName: "Bahrain Grand Prix",
        Results: [
          { position: "1", positionText: "1", Driver: driver("max_verstappen", "Max", "Verstappen"), Constructor: { name: "Red Bull" }, FastestLap: { rank: "1" } },
          { position: "2", positionText: "2", Driver: driver("zhou", "Guanyu", "Zhou"), Constructor: { name: "Sauber" }, FastestLap: { rank: "5" } },
          { position: "3", positionText: "3", Driver: driver("tsunoda", "Yuki", "Tsunoda"), Constructor: { name: "RB F1 Team" } },
          { position: "4", positionText: "4", Driver: driver("ocon", "Esteban", "Ocon"), Constructor: { name: "Alpine F1 Team" } },
          { position: "18", positionText: "R", Driver: driver("hamilton", "Lewis", "Hamilton"), Constructor: { name: "Mercedes" } },
        ],
      },
      {
        round: "5",
        date: "2024-04-21",
        raceName: "Chinese Grand Prix",
        Results: [
          { position: "1", positionText: "1", Driver: driver("max_verstappen", "Max", "Verstappen"), Constructor: { name: "Red Bull" }, FastestLap: { rank: "3" } },
          { position: "2", positionText: "2", Driver: driver("norris", "Lando", "Norris"), Constructor: { name: "McLaren" } },
        ],
      },
    ],
  },
};

const SPRINTS = {
  total: "2",
  RaceTable: {
    Races: [
      {
        round: "5",
        date: "2024-04-20",
        raceName: "Chinese Grand Prix",
        SprintResults: [
          { position: "1", positionText: "1", Driver: driver("max_verstappen", "Max", "Verstappen") },
          { position: "6", positionText: "6", Driver: driver("norris", "Lando", "Norris") },
        ],
      },
    ],
  },
};

function stubFetch(): typeof fetch {
  return (async (url: string) => {
    const data = String(url).includes("/sprint/") ? SPRINTS : RESULTS;
    return new Response(JSON.stringify({ MRData: data }), { status: 200 });
  }) as unknown as typeof fetch;
}

const VALID = new Set(["Red Bull Racing", "Kick Sauber", "RB", "Alpine", "Mercedes", "McLaren"]);

describe("jolpica-f1 mapping (offline)", () => {
  it("renames constructors to our roster branding", () => {
    expect(mapConstructorName("Red Bull")).toBe("Red Bull Racing");
    expect(mapConstructorName("RB F1 Team")).toBe("RB");
    expect(mapConstructorName("Sauber")).toBe("Kick Sauber");
    expect(mapConstructorName("Ferrari")).toBe("Ferrari"); // unmapped passes through
    expect(Object.keys(F1_CONSTRUCTOR_ALIASES)).toContain("Haas F1 Team");
  });

  it("maps results + sprints to F1 match rows", async () => {
    const rows = await fetchF1Season(2024, { fetchImpl: stubFetch(), throttleMs: 0, validConstructors: VALID });

    expect(rows).toHaveLength(7);
    expect(new Set(rows.map((r) => r.round))).toEqual(new Set([1, 5]));

    const winner = rows.find((r) => r.round === 1 && r.payload.driver === "Max Verstappen")!;
    expect(winner.payload).toMatchObject({
      race: "Bahrain Grand Prix",
      constructor: "Red Bull Racing",
      finish_position: 1,
      fastest_lap: true,
      sprint_position: null,
    });
    expect(winner.playedOn).toBe("2024-03-02");

    // DNF (positionText "R") → null finishing position, not the raw classification number.
    const dnf = rows.find((r) => r.payload.driver === "Lewis Hamilton")!;
    expect(dnf.payload.finish_position).toBeNull();

    // Only the rank-1 fastest lap counts.
    expect(rows.filter((r) => r.payload.fastest_lap)).toHaveLength(1);

    // Sprint positions attach by round + driver.
    const vesR5 = rows.find((r) => r.round === 5 && r.payload.driver === "Max Verstappen")!;
    expect(vesR5.payload.sprint_position).toBe(1);
    expect(rows.find((r) => r.round === 5 && r.payload.driver === "Lando Norris")!.payload.sprint_position).toBe(6);
  });

  it("throws loudly on a constructor that doesn't resolve to the roster", async () => {
    await expect(
      fetchF1Season(2024, { fetchImpl: stubFetch(), throttleMs: 0, validConstructors: new Set(["Mercedes"]) }),
    ).rejects.toThrow(/Unrecognised F1 constructor/);
  });
});

// ── Live end-to-end check against the accuracy fixture (opt-in; needs network) ────
// Run with: JOLPICA_LIVE=1 npm test -- jolpica-f1
describe.skipIf(!process.env.JOLPICA_LIVE)("jolpica-f1 vs accuracy fixture (live 2024)", () => {
  it("reproduces formula-1-2024.csv exactly", async () => {
    const roster = getSeasonRoster("formula-1", "2024") ?? [];
    const rows = await fetchF1Season(2024, { validConstructors: new Set(roster.map((c) => c.name)) });

    const csv = fs.readFileSync(path.join(process.cwd(), "src/domain/__fixtures__/formula-1-2024.csv"), "utf8");
    const fx = csv.trim().split("\n").slice(1).map((l) => {
      const [round, , , driver, , finish, fl, sprint] = l.split(",");
      return { round: Number(round), driver, finish, fl, sprint };
    });

    expect(rows).toHaveLength(fx.length);
    const key = (round: number, d: string) => `${round}|${d}`;
    const byKey = new Map(rows.map((r) => [key(r.round, r.payload.driver), r]));

    for (const f of fx) {
      const got = byKey.get(key(f.round, f.driver));
      expect(got, `missing ${f.round} ${f.driver}`).toBeDefined();
      const p = got!.payload;
      // finish: fixture "DNF" ↔ null, else numeric equality.
      if (f.finish === "DNF") expect(p.finish_position).toBeNull();
      else expect(p.finish_position).toBe(Number(f.finish));
      expect(p.fastest_lap).toBe(f.fl === "true");
      expect(p.sprint_position ?? "").toBe(f.sprint === "" ? "" : Number(f.sprint));
    }
  }, 30_000);
});
