import { describe, expect, it } from "vitest";
import { normalizeSeason } from "./season";

describe("normalizeSeason", () => {
  it("accepts the canonical YYYY-YY form", () => {
    expect(normalizeSeason("1998-99")).toBe("1998-99");
    expect(normalizeSeason("2024-25")).toBe("2024-25");
  });

  it("normalises slash and four-digit end forms", () => {
    expect(normalizeSeason("1998/1999")).toBe("1998-99");
    expect(normalizeSeason("1998-1999")).toBe("1998-99");
    expect(normalizeSeason("1998/99")).toBe("1998-99");
    expect(normalizeSeason("  2024 / 2025 ".replace(/ /g, ""))).toBe("2024-25");
  });

  it("handles the century rollover", () => {
    expect(normalizeSeason("1999-00")).toBe("1999-00");
    expect(normalizeSeason("1999/2000")).toBe("1999-00");
    expect(normalizeSeason("2000-01")).toBe("2000-01");
  });

  it("rejects non-consecutive years and bad formats", () => {
    expect(normalizeSeason("1998-97")).toBeNull(); // not consecutive
    expect(normalizeSeason("1998-00")).toBeNull();
    expect(normalizeSeason("98-99")).toBeNull(); // not 4-digit start
    expect(normalizeSeason("1998")).toBeNull(); // single year
    expect(normalizeSeason("1998-1999-2000")).toBeNull();
    expect(normalizeSeason("")).toBeNull();
    expect(normalizeSeason("premier")).toBeNull();
    expect(normalizeSeason("1700-01")).toBeNull(); // out of plausible range
  });
});
