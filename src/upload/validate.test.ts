import { describe, it, expect } from "vitest";
import { validateSoccerUpload, MAX_ROWS, MAX_BYTES, type ValidationIssue } from "./validate";

const HEADER = "round,date,home_team,away_team,home_goals,away_goals";
const VALID = "1,2025-08-16,Liverpool,Bournemouth,2,0";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n") + "\n";
const base = { leagueId: "premier-league", season: "2024-25" };
const has = (issues: ValidationIssue[], code: string) => issues.some((i) => i.code === code);

describe("validateSoccerUpload — errors (block save)", () => {
  it("unknown league", () => {
    const out = validateSoccerUpload({ csv: csv(VALID), leagueId: "nope", season: "2024-25" });
    expect(out.ok).toBe(false);
    expect(has(out.errors, "unknown_league")).toBe(true);
  });

  it("missing required columns", () => {
    const out = validateSoccerUpload({
      csv: "round,date,home_team,away_team,home_goals\n1,2025-08-16,Liverpool,Bournemouth,2\n",
      ...base,
    });
    expect(out.ok).toBe(false);
    expect(has(out.errors, "missing_columns")).toBe(true);
  });

  it("bad date and bad number produce per-row errors with field+row", () => {
    const out = validateSoccerUpload({
      csv: csv("1,2025-13-40,Liverpool,Bournemouth,2,0", "1,2025-08-16,Arsenal,Chelsea,x,0"),
      ...base,
    });
    expect(out.ok).toBe(false);
    const bad = out.errors.filter((e) => e.code === "bad_row");
    expect(bad.find((e) => e.field === "date")?.row).toBe(1);
    expect(bad.find((e) => e.field === "home_goals")?.row).toBe(2);
  });

  it("too many rows", () => {
    const rows = Array.from({ length: MAX_ROWS + 1 }, () => VALID).join("\n");
    const out = validateSoccerUpload({ csv: `${HEADER}\n${rows}\n`, ...base });
    expect(has(out.errors, "too_many_rows")).toBe(true);
  });

  it("file too large", () => {
    const out = validateSoccerUpload({ csv: csv(VALID), byteSize: MAX_BYTES + 1, ...base });
    expect(has(out.errors, "file_too_large")).toBe(true);
  });
});

describe("validateSoccerUpload — warnings (allow save)", () => {
  it("unknown team warns but does not block, and is reported", () => {
    const out = validateSoccerUpload({ csv: csv("1,2025-08-16,Liverpool,Fake FC,2,0"), ...base });
    expect(out.ok).toBe(true); // not blocked
    expect(has(out.warnings, "unknown_team")).toBe(true);
    expect(out.unknownEntities).toContain("Fake FC");
  });

  it("partial season warns and sets isComplete=false", () => {
    const out = validateSoccerUpload({ csv: csv(VALID), ...base });
    expect(out.ok).toBe(true);
    expect(has(out.warnings, "partial_season")).toBe(true);
    expect(out.isComplete).toBe(false);
    expect(out.roundsPresent).toBe(1);
  });

  it("duplicate fixtures warn", () => {
    const out = validateSoccerUpload({ csv: csv(VALID, VALID), ...base });
    expect(out.ok).toBe(true);
    expect(has(out.warnings, "duplicate_fixture")).toBe(true);
  });
});

describe("validateSoccerUpload — clean upload", () => {
  it("known teams, no duplicates → no errors, no team/dup warnings", () => {
    const out = validateSoccerUpload({
      csv: csv("1,2025-08-16,Liverpool,Bournemouth,2,0", "1,2025-08-16,Arsenal,Chelsea,1,1"),
      ...base,
    });
    expect(out.ok).toBe(true);
    expect(out.errors).toEqual([]);
    expect(has(out.warnings, "unknown_team")).toBe(false);
    expect(has(out.warnings, "duplicate_fixture")).toBe(false);
    expect(out.results).toHaveLength(2);
  });
});
