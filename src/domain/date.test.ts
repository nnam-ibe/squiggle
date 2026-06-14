import { describe, it, expect } from "vitest";
import { isValidIsoDate } from "./date";

describe("isValidIsoDate", () => {
  it("accepts real dates", () => {
    expect(isValidIsoDate("2025-08-16")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true); // leap year
  });

  it("rejects bad formats", () => {
    expect(isValidIsoDate("2025/08/16")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
    expect(isValidIsoDate("2025-8-1")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });

  it("rejects impossible calendar dates that pass the format", () => {
    expect(isValidIsoDate("2025-13-40")).toBe(false);
    expect(isValidIsoDate("2025-02-30")).toBe(false);
    expect(isValidIsoDate("2025-00-10")).toBe(false);
  });
});
