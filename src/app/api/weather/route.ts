import type { NextRequest } from "next/server";
import {
  buildForecastUrl,
  ForecastParseError,
  type OpenMeteoForecast,
  parseForecast,
} from "@/lib/weather/openMeteo";
import { createMemoryCache, errorResponse, fetchJson, UpstreamError } from "@/lib/server/upstream";
import type { WeatherSnapshot } from "@/types/weather";

const CACHE_SECONDS = 15 * 60;
const cache = createMemoryCache<WeatherSnapshot>(CACHE_SECONDS * 1000);

/** ~1 km precision: nearby users share cache entries and nothing more precise is sent upstream. */
const round = (n: number) => Math.round(n * 100) / 100;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (
    !params.has("lat") || !params.has("lon") ||
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    Math.abs(lat) > 90 || Math.abs(lon) > 180
  ) {
    return errorResponse("badRequest");
  }

  const latitude = round(lat);
  const longitude = round(lon);
  const key = `${latitude},${longitude}`;

  let snapshot = cache.get(key);
  let cacheStatus = "HIT";
  if (!snapshot) {
    cacheStatus = "MISS";
    try {
      const data = await fetchJson<OpenMeteoForecast>(buildForecastUrl(latitude, longitude));
      snapshot = parseForecast(data);
      cache.set(key, snapshot);
    } catch (error) {
      if (error instanceof UpstreamError) return errorResponse(error.code);
      if (error instanceof ForecastParseError) return errorResponse("upstream");
      throw error;
    }
  }

  return Response.json(snapshot, {
    headers: {
      "cache-control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
      "x-smart-closet-cache": cacheStatus,
    },
  });
}
