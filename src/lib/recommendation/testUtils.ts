import type { Garment } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/types/weather";

export function weather(over: Partial<{
  morning: number;
  afternoon: number;
  rain: number;
}> = {}): WeatherSnapshot {
  const morning = over.morning ?? 18;
  const afternoon = over.afternoon ?? 22;
  return {
    source: "manual",
    temperatureNow: morning,
    min: Math.min(morning, afternoon),
    max: Math.max(morning, afternoon),
    morning: { hour: 9, temperature: morning },
    afternoon: { hour: 15, temperature: afternoon },
    precipitationProbability: over.rain ?? 0,
    fetchedAt: "2026-11-22T12:00:00.000Z",
  };
}

let seq = 0;
export function garment(over: Partial<Garment> & Pick<Garment, "category">): Garment {
  seq += 1;
  return {
    id: over.id ?? `g${seq}`,
    name: over.name ?? `Prenda ${seq}`,
    color: "black",
    warmth: "medium",
    formality: 3,
    occasions: ["office", "casual", "dinner", "sport", "formal"],
    rainFriendly: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}
