import Papa from "papaparse";
import type { NormalizedResult, RowError, SportAdapter } from "@/domain/types";

export interface ParseResult {
  results: NormalizedResult[];
  errors: RowError[];
  /** Number of data rows seen (excludes the header), including invalid ones. */
  rowCount: number;
  /** Header column names as detected (trimmed), for column-presence checks. */
  fields: string[];
}

function isRowError(x: NormalizedResult | RowError): x is RowError {
  return "message" in x;
}

/**
 * Parse a results CSV into normalized results + structured per-row errors.
 *
 * Uses Papa Parse (header row, case-insensitive via the adapter), then maps each
 * data row through the sport adapter's `parseRow`. Row numbers are 1-based and
 * exclude the header (row 1 = first data line).
 */
export function parseResultsCsv(csv: string, adapter: SportAdapter): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const results: NormalizedResult[] = [];
  const errors: RowError[] = [];

  // Surface Papa's structural parse errors (e.g. ragged rows). Papa's `row` is a
  // 0-based data-row index; present it 1-based to match adapter row numbers.
  for (const e of parsed.errors) {
    errors.push({ row: (e.row ?? 0) + 1, message: e.message });
  }

  parsed.data.forEach((raw, i) => {
    const out = adapter.parseRow(raw, i + 1);
    if (isRowError(out)) errors.push(out);
    else results.push(out);
  });

  return { results, errors, rowCount: parsed.data.length, fields: parsed.meta.fields ?? [] };
}
