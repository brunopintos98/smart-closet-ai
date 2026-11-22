import type { HourlyPoint, WeatherSnapshot } from "@/types/weather";

/**
 * Open-Meteo free API (no key). Terms: non-commercial use only, under
 * 10,000 calls/day, 5,000/hour and 600/minute; data under CC BY 4.0 with a
 * visible "Weather data by Open-Meteo.com" link. See docs/decision-log.md.
 */
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export const MORNING_HOURS = [7, 11] as const;
export const AFTERNOON_HOURS = [13, 18] as const;
export const DAY_HOURS = [7, 22] as const;

export function buildForecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,weather_code",
    hourly: "temperature_2m,precipitation_probability",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "1",
  });
  return `${FORECAST_URL}?${params}`;
}

export function buildGeocodingUrl(name: string): string {
  const params = new URLSearchParams({
    name,
    count: "5",
    language: "es",
    format: "json",
  });
  return `${GEOCODING_URL}?${params}`;
}

/** Subset of the forecast response we rely on. */
export interface OpenMeteoForecast {
  timezone?: string;
  current?: { time: string; temperature_2m: number; weather_code?: number };
  hourly?: {
    time: string[];
    temperature_2m: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
  daily?: {
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
  };
}

export class ForecastParseError extends Error {}

/** "2026-11-22T09:00" → 9. Open-Meteo returns local ISO times without offset. */
function hourOf(time: string): number {
  return Number(time.slice(11, 13));
}

function pointsBetween(
  f: Required<Pick<OpenMeteoForecast, "hourly">>["hourly"],
  [from, to]: readonly [number, number],
): HourlyPoint[] {
  const points: HourlyPoint[] = [];
  f.time.forEach((time, i) => {
    const hour = hourOf(time);
    const temperature = f.temperature_2m[i];
    if (hour >= from && hour <= to && typeof temperature === "number") {
      points.push({ hour, temperature: Math.round(temperature) });
    }
  });
  return points;
}

/** Turns the raw API payload into the snapshot the recommender uses. */
export function parseForecast(data: OpenMeteoForecast, now = new Date()): WeatherSnapshot {
  const { current, hourly, daily } = data;
  if (!current || typeof current.temperature_2m !== "number" || !hourly?.time?.length) {
    throw new ForecastParseError("Missing current or hourly data");
  }

  const temperatureNow = Math.round(current.temperature_2m);
  const fallback: HourlyPoint = { hour: hourOf(current.time), temperature: temperatureNow };

  const morningPoints = pointsBetween(hourly, MORNING_HOURS);
  const afternoonPoints = pointsBetween(hourly, AFTERNOON_HOURS);
  const morning = morningPoints.reduce<HourlyPoint | null>(
    (min, p) => (!min || p.temperature < min.temperature ? p : min),
    null,
  ) ?? fallback;
  const afternoon = afternoonPoints.reduce<HourlyPoint | null>(
    (max, p) => (!max || p.temperature > max.temperature ? p : max),
    null,
  ) ?? fallback;

  const probabilities = (hourly.precipitation_probability ?? [])
    .filter((p, i) => {
      const h = hourOf(hourly.time[i]);
      return typeof p === "number" && h >= DAY_HOURS[0] && h <= DAY_HOURS[1];
    }) as number[];
  const dailyProbability = daily?.precipitation_probability_max?.[0];
  const precipitationProbability = probabilities.length
    ? Math.max(...probabilities)
    : typeof dailyProbability === "number"
      ? dailyProbability
      : 0;

  const temps = hourly.temperature_2m.filter((t): t is number => typeof t === "number");
  const min = daily?.temperature_2m_min?.[0] ?? Math.min(...temps);
  const max = daily?.temperature_2m_max?.[0] ?? Math.max(...temps);

  return {
    source: "live",
    temperatureNow,
    min: Math.round(min),
    max: Math.round(max),
    morning,
    afternoon,
    precipitationProbability: Math.round(precipitationProbability),
    weatherCode: current.weather_code,
    timezone: data.timezone,
    fetchedAt: now.toISOString(),
  };
}

export interface GeocodingResult {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocoding {
  results?: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }[];
}

/** The API omits "results" entirely when nothing matches. */
export function parseGeocoding(data: OpenMeteoGeocoding): GeocodingResult[] {
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: r.admin1 || undefined,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
