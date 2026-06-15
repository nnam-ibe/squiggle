import { commitSoccerUpload } from "@/upload/commit";
import { getDb } from "@/db/client";
import { MAX_BYTES } from "@/upload/validate";
import {
  hashIp,
  ipFromHeaders,
  rateLimit,
  createDrizzleRateLimitStore,
} from "@/upload/rate-limit";

export const runtime = "nodejs";

const SALT = process.env.IP_HASH_SALT || "squiggle-dev-salt";

/**
 * POST /api/datasets — multipart { file, leagueId, season }. Rate-limited per IP;
 * re-validates server-side; replaces any existing (league, season) dataset and
 * persists the new one + matches. Returns the permalink. 429 when rate-limited,
 * 400 on validation errors, 200 on success.
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
  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        ok: false,
        errors: [{ code: "file_too_large", message: `File is ${file.size} bytes; limit is ${MAX_BYTES} (2 MB)` }],
      },
      { status: 400 },
    );
  }

  const ipHash = hashIp(ipFromHeaders(req.headers), SALT);
  const rl = await rateLimit({ ipHash, store: createDrizzleRateLimitStore() });
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return Response.json(
      {
        ok: false,
        errors: [{ code: "rate_limited", message: `Upload limit reached (${rl.limit}/hour). Try again later.` }],
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const csv = await file.text();
  const result = await commitSoccerUpload({
    csv,
    leagueId,
    season,
    sourceFilename: file.name,
    uploaderIpHash: ipHash,
    byteSize: file.size,
    db: getDb(),
  });
  return Response.json(result, { status: result.status });
}
