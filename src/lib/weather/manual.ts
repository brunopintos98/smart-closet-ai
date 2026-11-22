import type { WeatherSnapshot } from "@/types/weather";

/**
 * Fallback when the forecast is unavailable: the user picks a temperature
 * and whether it rains. We do not invent a daily curve; morning and
 * afternoon use the same value.
 */
export function buildManualWeather(temperature: number, rain: boolean, now = new Date()): WeatherSnapshot {
  return {
    source: "manual",
    temperatureNow: temperature,
    min: temperature,
    max: temperature,
    morning: { hour: 9, temperature },
    afternoon: { hour: 15, temperature },
    precipitationProbability: rain ? 80 : 0,
    fetchedAt: now.toISOString(),
  };
}
