import { previewSoccerUpload } from "@/upload/preview";
import { MAX_BYTES } from "@/upload/validate";

export const runtime = "nodejs";

/**
 * POST /api/datasets/validate — multipart form { file, leagueId, season }.
 * Parses + validates + computes the final table for preview. Persists nothing.
 * 200 when valid (may carry warnings); 400 when there are errors.
 */
export async function POST(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json(
      { ok: false, errors: [{ code: "bad_request", message: "Expected multipart form data" }] },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const leagueId = String(form.get("leagueId") ?? "");
  const season = String(form.get("season") ?? "");

  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, errors: [{ code: "no_file", message: "A CSV file field 'file' is required" }] },
      { status: 400 },
    );
  }
  // Cheap guard before reading the whole file into memory.
  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        ok: false,
        errors: [{ code: "file_too_large", message: `File is ${file.size} bytes; limit is ${MAX_BYTES} (2 MB)` }],
      },
      { status: 400 },
    );
  }

  const csv = await file.text();
  const preview = previewSoccerUpload({ csv, leagueId, season, byteSize: file.size });
  return Response.json(preview, { status: preview.ok ? 200 : 400 });
}
