import { getDatasetStandings } from "@/server/datasets";

export const runtime = "nodejs";

/**
 * GET /api/datasets/:sport/:league/:season — raw matches + computed standings for
 * a persisted dataset, with a config color map. 404 when there's no such dataset.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string; league: string; season: string }> },
): Promise<Response> {
  const { sport, league, season } = await params;
  const data = await getDatasetStandings({ sport, league, season });
  if (!data) {
    return Response.json({ error: "not_found", sport, league, season }, { status: 404 });
  }
  return Response.json(data);
}
