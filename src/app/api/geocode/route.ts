import type { NextRequest } from "next/server";
import { buildGeocodingUrl, type GeocodingResult, parseGeocoding } from "@/lib/weather/openMeteo";
import { createMemoryCache, errorResponse, fetchJson, UpstreamError } from "@/lib/server/upstream";

const CACHE_SECONDS = 24 * 60 * 60;
const cache = createMemoryCache<GeocodingResult[]>(CACHE_SECONDS * 1000);

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  // The geocoder returns nothing for empty or one-letter searches.
  if (query.length < 2) return errorResponse("badRequest");

  const key = query.toLowerCase();
  let results = cache.get(key);
  if (!results) {
    try {
      results = parseGeocoding(await fetchJson(buildGeocodingUrl(query)));
      cache.set(key, results);
    } catch (error) {
      if (error instanceof UpstreamError) return errorResponse(error.code);
      throw error;
    }
  }

  return Response.json(
    { results },
    { headers: { "cache-control": `public, s-maxage=${CACHE_SECONDS}` } },
  );
}
