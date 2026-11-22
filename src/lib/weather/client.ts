import type { GeocodingResult } from "./openMeteo";
import type { WeatherSnapshot } from "@/types/weather";

const CLIENT_TIMEOUT_MS = 8000;

export class WeatherRequestError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) });
  } catch {
    throw new WeatherRequestError("network");
  }
  if (!response.ok) throw new WeatherRequestError(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function fetchWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  return getJson(`/api/weather?lat=${latitude}&lon=${longitude}`);
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const { results } = await getJson<{ results: GeocodingResult[] }>(
    `/api/geocode?q=${encodeURIComponent(query)}`,
  );
  return results;
}

export const DEFAULT_LOCATION: GeocodingResult = {
  name: "Buenos Aires",
  country: "Argentina",
  latitude: -34.61,
  longitude: -58.38,
};
