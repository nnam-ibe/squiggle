import { getCatalog } from "@/server/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // reflects DB dataset presence at request time

/**
 * GET /api/catalog — the selector data model: every configured sport → league →
 * season, with each season marked for whether a persisted dataset exists.
 */
export async function GET(): Promise<Response> {
  const catalog = await getCatalog();
  return Response.json(catalog);
}
