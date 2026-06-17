import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

/**
 * GET /api/datasets/template — download the soccer CSV upload template (the
 * canonical file in data/templates, served as an attachment).
 */
export async function GET(): Promise<Response> {
  const csv = fs.readFileSync(
    path.join(process.cwd(), "data/templates/soccer-results-template.csv"),
    "utf8",
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="soccer-results-template.csv"',
    },
  });
}
