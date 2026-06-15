import { describe, it, expect } from "vitest";
import { POST } from "./route";

// DB-free paths only: these return before any rate-limit / DB access.
describe("POST /api/datasets — early validation (no DB)", () => {
  it("400 when the file field is missing", async () => {
    const fd = new FormData();
    fd.set("leagueId", "premier-league");
    fd.set("season", "2024-25");
    const res = await POST(new Request("http://localhost/api/datasets", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].code).toBe("no_file");
  });

  it("400 on a non-multipart body", async () => {
    const res = await POST(
      new Request("http://localhost/api/datasets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(400);
  });
});
