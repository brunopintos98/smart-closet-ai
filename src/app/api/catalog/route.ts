import { connection, type NextRequest } from "next/server";
import { readJpegSize } from "@/lib/catalog/jpeg";
import { CATALOG_MAX_BYTES, type CatalogErrorCode, validateCatalogImage } from "@/lib/catalog/limits";
import { catalogGarment, isAnthropicConfigured } from "@/lib/server/catalogService";
import { dailyLimit, QuotaUnavailableError, quotaBackend, reserveDailySlot } from "@/lib/server/dailyQuota";

export const maxDuration = 30;

const STATUS: Record<CatalogErrorCode, number> = {
  disabled: 503,
  badImage: 415,
  tooLarge: 413,
  dailyLimit: 429,
  notGarment: 422,
  unavailable: 503,
};

function fail(code: CatalogErrorCode): Response {
  return Response.json({ error: code }, { status: STATUS[code], headers: { "cache-control": "no-store" } });
}

function isEnabled(): boolean {
  return isAnthropicConfigured() && quotaBackend() !== "none";
}

/** Lets the form show the right badge without trying a paid call. */
export async function GET() {
  await connection();
  return Response.json({ enabled: isEnabled() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) return fail("disabled");

  // Protection 4: cheap checks before reading the body or spending anything.
  if (request.headers.get("content-type") !== "image/jpeg") return fail("badImage");
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > CATALOG_MAX_BYTES) return fail("tooLarge");

  const bytes = new Uint8Array(await request.arrayBuffer());
  const invalid = validateCatalogImage(bytes, readJpegSize);
  if (invalid) return fail(invalid);

  // Protection 2: global daily cap, reserved before the paid call.
  try {
    const { allowed } = await reserveDailySlot(dailyLimit());
    if (!allowed) return fail("dailyLimit");
  } catch (error) {
    if (error instanceof QuotaUnavailableError) return fail("unavailable");
    throw error;
  }

  const result = await catalogGarment(bytes);
  if (!result.ok) return fail(result.reason);
  return Response.json({ suggestion: result.suggestion }, { headers: { "cache-control": "no-store" } });
}
