export interface HourlyPoint {
  /** Local hour of day, 0-23. */
  hour: number;
  temperature: number;
}

export interface WeatherLocation {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * The weather facts the recommender needs. Built either from Open-Meteo
 * ("live") or from the manual fallback controls ("manual").
 */
export interface WeatherSnapshot {
  source: "live" | "manual";
  temperatureNow: number;
  min: number;
  max: number;
  /** Coldest reading of the morning window (07-11 h), with its hour. */
  morning: HourlyPoint;
  /** Warmest reading of the afternoon window (13-18 h), with its hour. */
  afternoon: HourlyPoint;
  /** Highest probability of precipitation during the day, 0-100. */
  precipitationProbability: number;
  weatherCode?: number;
  location?: WeatherLocation;
  timezone?: string;
  fetchedAt: string;
}
