import { describe, expect, it } from "vitest";
import { buildForecastUrl, ForecastParseError, parseForecast, parseGeocoding } from "./openMeteo";

const hours = Array.from({ length: 24 }, (_, h) => `2026-11-22T${String(h).padStart(2, "0")}:00`);
// Cold at dawn, warm mid-afternoon.
const temps = [10, 9, 9, 8, 8, 8, 9, 10, 11, 11.4, 13, 15, 17, 19, 20, 21.6, 21, 20, 18, 16, 15, 14, 13, 12];
const rain = hours.map((_, h) => (h === 3 ? 95 : h === 18 ? 70 : 10));

describe("parseForecast", () => {
  const snapshot = parseForecast(
    {
      timezone: "America/Argentina/Buenos_Aires",
      current: { time: "2026-11-22T08:15", temperature_2m: 10.6, weather_code: 61 },
      hourly: { time: hours, temperature_2m: temps, precipitation_probability: rain },
      daily: { temperature_2m_max: [21.6], temperature_2m_min: [8], precipitation_probability_max: [95] },
    },
    new Date("2026-11-22T11:15:00Z"),
  );

  it("takes the coldest morning hour and the warmest afternoon hour", () => {
    expect(snapshot.morning).toEqual({ hour: 7, temperature: 10 });
    expect(snapshot.afternoon).toEqual({ hour: 15, temperature: 22 });
  });

  it("only counts rain during waking hours", () => {
    expect(snapshot.precipitationProbability).toBe(70);
  });

  it("rounds current, min and max", () => {
    expect(snapshot).toMatchObject({ temperatureNow: 11, min: 8, max: 22, source: "live", weatherCode: 61 });
  });

  it("throws on an unusable payload", () => {
    expect(() => parseForecast({})).toThrow(ForecastParseError);
  });

  it("falls back to the daily rain probability when hourly is missing", () => {
    const s = parseForecast({
      current: { time: "2026-11-22T08:00", temperature_2m: 15 },
      hourly: { time: hours, temperature_2m: temps },
      daily: { precipitation_probability_max: [40] },
    });
    expect(s.precipitationProbability).toBe(40);
  });
});

describe("Open-Meteo helpers", () => {
  it("requests local time so hours match the user's day", () => {
    const url = new URL(buildForecastUrl(-34.61, -58.38));
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("hourly")).toContain("precipitation_probability");
  });

  it("returns an empty list when the geocoder finds nothing", () => {
    expect(parseGeocoding({})).toEqual([]);
  });
});
