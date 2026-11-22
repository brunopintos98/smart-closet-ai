"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { chosenLocationStore } from "@/lib/store/appStore";
import type { WeatherLocation, WeatherSnapshot } from "@/types/weather";
import { DEFAULT_LOCATION, fetchWeather } from "./client";
import { buildManualWeather } from "./manual";

export type LocationKind = "geo" | "default" | "search";

interface ResolvedLocation {
  location: WeatherLocation;
  kind: LocationKind;
}

type FetchResult =
  | { key: string; ok: true; snapshot: WeatherSnapshot }
  | { key: string; ok: false };

const GEO_OPTIONS: PositionOptions = { timeout: 8000, maximumAge: 30 * 60 * 1000 };

/**
 * Location → forecast → snapshot, with every fallback the spec asks for:
 * geolocation denied → Buenos Aires; forecast failure → manual controls.
 */
export function useWeather() {
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ temperature: 18, rain: false });

  const locate = useCallback(() => {
    const useDefault = () => setResolved({ location: DEFAULT_LOCATION, kind: "default" });
    if (!("geolocation" in navigator)) {
      Promise.resolve().then(useDefault);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setResolved({
          kind: "geo",
          location: {
            name: "",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        }),
      useDefault,
      GEO_OPTIONS,
    );
  }, []);

  useEffect(() => {
    const saved = chosenLocationStore.get();
    if (saved) {
      Promise.resolve().then(() => setResolved({ location: saved, kind: "search" }));
    } else {
      locate();
    }
  }, [locate]);

  const key = resolved
    ? `${resolved.location.latitude},${resolved.location.longitude}#${attempt}`
    : null;

  useEffect(() => {
    if (!resolved || !key) return;
    let cancelled = false;
    fetchWeather(resolved.location.latitude, resolved.location.longitude)
      .then((snapshot) => !cancelled && setResult({ key, ok: true, snapshot }))
      .catch(() => !cancelled && setResult({ key, ok: false }));
    return () => {
      cancelled = true;
    };
  }, [resolved, key]);

  const current = result && result.key === key ? result : null;
  const status: "locating" | "loading" | "ready" | "error" = !resolved
    ? "locating"
    : !current
      ? "loading"
      : current.ok
        ? "ready"
        : "error";

  const useManual = manualMode || status === "error";
  const weather = useMemo<WeatherSnapshot | null>(() => {
    if (useManual) return buildManualWeather(manual.temperature, manual.rain);
    if (current?.ok) return { ...current.snapshot, location: resolved?.location };
    return null;
  }, [useManual, manual, current, resolved]);

  return {
    status,
    weather,
    location: resolved,
    useManual,
    manualMode,
    manual,
    setManual,
    setManualMode,
    retry: () => setAttempt((n) => n + 1),
    chooseCity: (location: WeatherLocation) => {
      chosenLocationStore.set(location);
      setManualMode(false);
      setResolved({ location, kind: "search" });
    },
    useMyLocation: () => {
      chosenLocationStore.set(null);
      setManualMode(false);
      locate();
    },
  };
}

export type WeatherController = ReturnType<typeof useWeather>;
