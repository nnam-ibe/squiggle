import { describe, it, expect } from "vitest";
import { getDb } from "@/db/client";
import { getCatalog } from "./catalog";

// The live DB has the seeded Premier League 2025-26 dataset; assert the catalog
// reflects real dataset presence read from the DB.
describe.skipIf(!process.env.DATABASE_URL)("getCatalog (integration)", () => {
  it("marks seasons that actually have a dataset in the DB", async () => {
    const catalog = await getCatalog(getDb());
    const pl = catalog.sports
      .find((s) => s.id === "soccer")!
      .leagues.find((l) => l.id === "premier-league")!;
    expect(pl.seasons.find((s) => s.season === "2025-26")!.hasData).toBe(true);
  });
});
