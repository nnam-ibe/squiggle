import { describe, it, expect } from "vitest";
import { POST } from "./route";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";

function post(fields: Record<string, string>, file?: { name: string; content: string }): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  if (file) fd.set("file", new File([file.content], file.name, { type: "text/csv" }));
  return new Request("http://localhost/api/datasets/validate", { method: "POST", body: fd });
}

describe("POST /api/datasets/validate", () => {
  it("200 + previewTable for a valid upload", async () => {
    const res = await POST(
      post(
        { leagueId: "premier-league", season: "2024-25" },
        { name: "pl.csv", content: csv("1,2025-08-16,Liverpool,Bournemouth,3,0") },
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.previewTable[0].team).toBe("Liverpool");
    expect(body.roundsPresent).toBe(1);
  });

  it("400 with structured errors for an invalid upload", async () => {
    const res = await POST(
      post(
        { leagueId: "premier-league", season: "2024-25" },
        { name: "bad.csv", content: csv("1,2025-13-40,Liverpool,Bournemouth,2,0") },
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errors.some((e: { code: string }) => e.code === "bad_row")).toBe(true);
  });

  it("400 when the file field is missing", async () => {
    const res = await POST(post({ leagueId: "premier-league", season: "2024-25" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].code).toBe("no_file");
  });

  it("400 for an unknown league", async () => {
    const res = await POST(
      post(
        { leagueId: "nope", season: "2024-25" },
        { name: "x.csv", content: csv("1,2025-08-16,A,B,1,0") },
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.some((e: { code: string }) => e.code === "unknown_league")).toBe(true);
  });
});
