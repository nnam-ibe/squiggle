import { describe, it, expect } from "vitest";
import { GET } from "./route";

function get(sport: string, league: string, season: string) {
  return GET(new Request("http://localhost/api/datasets"), {
    params: Promise.resolve({ sport, league, season }),
  });
}

describe("GET /api/datasets/:sport/:league/:season — not found (no DB)", () => {
  it("404 for an unknown league", async () => {
    const res = await get("soccer", "nope", "2024-25");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });
});
