"use client";

import { CloudOff, CloudRain, LocateFixed, MapPin, RotateCw, Search, Sun, Thermometer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { copy, weatherCodeLabel } from "@/copy/es-AR";
import { searchCities } from "@/lib/weather/client";
import type { GeocodingResult } from "@/lib/weather/openMeteo";
import type { WeatherController } from "@/lib/weather/useWeather";
import { StatusBadge } from "./StatusBadge";

function locationLabel(w: WeatherController): string {
  if (!w.location) return "";
  if (w.location.kind === "geo") return copy.weather.currentLocation;
  const { name, region, country } = w.location.location;
  return [name, region && region !== name ? region : null, country].filter(Boolean).join(", ");
}

type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "results"; query: string; results: GeocodingResult[] }
  | { kind: "error"; message: string };

function CitySearch({ weather, onDone }: { weather: WeatherController; onDone: () => void }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setState({ kind: "error", message: copy.weather.tooShort });
      return;
    }
    setState({ kind: "searching" });
    try {
      const results = await searchCities(q);
      setState(
        results.length
          ? { kind: "results", query: q, results }
          : { kind: "error", message: copy.weather.cityNotFound(q) },
      );
    } catch {
      setState({ kind: "error", message: copy.weather.searchFailed });
    }
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <form onSubmit={submit} className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="city-search">{copy.weather.searchPlaceholder}</label>
        <input
          id="city-search"
          className="field"
          placeholder={copy.weather.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button className="btn btn-primary px-4" disabled={state.kind === "searching"} aria-label={copy.weather.searchButton}>
          <Search className="size-4" />
        </button>
      </form>
      {state.kind === "searching" && <p className="mt-2 text-sm text-muted">{copy.weather.searching}</p>}
      {state.kind === "error" && <p className="mt-2 text-sm text-danger" role="alert">{state.message}</p>}
      {state.kind === "results" && (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          {state.results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-sand"
                onClick={() => {
                  weather.chooseCity(r);
                  onDone();
                }}
              >
                <MapPin className="size-4 text-muted" />
                <span>
                  {r.name}
                  <span className="text-muted">{[r.region, r.country].filter(Boolean).map((s) => `, ${s}`).join("")}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-ghost mt-2 -ml-3 text-sm" onClick={() => { weather.useMyLocation(); onDone(); }}>
        <LocateFixed className="size-4" /> {copy.weather.useMyLocation}
      </button>
    </div>
  );
}

function ManualControls({ weather }: { weather: WeatherController }) {
  const { manual, setManual } = weather;
  return (
    <div className="mt-4 space-y-4 rounded-2xl bg-sand/60 p-4">
      <div>
        <label htmlFor="manual-temp" className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-1.5"><Thermometer className="size-4" /> {copy.weather.manualTemperature}</span>
          <span className="font-serif text-lg">{manual.temperature} °C</span>
        </label>
        <input
          id="manual-temp"
          type="range"
          min={-5}
          max={40}
          value={manual.temperature}
          onChange={(e) => setManual({ ...manual, temperature: Number(e.target.value) })}
          className="mt-2 w-full accent-ink"
        />
      </div>
      <fieldset>
        <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium"><CloudRain className="size-4" /> {copy.weather.manualRain}</legend>
        <div className="flex gap-2">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={manual.rain === value}
              onClick={() => setManual({ ...manual, rain: value })}
              className={`btn flex-1 py-2 ${manual.rain === value ? "btn-primary" : "btn-secondary"}`}
            >
              {value ? copy.weather.yes : copy.weather.no}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function WeatherCard({ weather }: { weather: WeatherController }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { status, useManual } = weather;
  const live = status === "ready" && !weather.manualMode ? weather.weather : null;

  return (
    <section className="rounded-3xl bg-surface p-5 ring-1 ring-line" aria-labelledby="weather-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="weather-title" className="eyebrow">{copy.weather.title}</h2>
        <StatusBadge status="working" />
      </div>

      {(status === "locating" || status === "loading") && !weather.manualMode && (
        <div className="mt-4 animate-pulse space-y-3" aria-live="polite">
          <div className="h-10 w-28 rounded-lg bg-sand" />
          <div className="h-4 w-48 rounded bg-sand" />
          <span className="sr-only">{copy.weather.loading}</span>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex gap-3" role="alert">
          <CloudOff className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="font-medium">{copy.weather.errorTitle}</p>
            <p className="text-sm text-muted">{copy.weather.errorBody}</p>
            <button type="button" className="btn btn-ghost -ml-3 mt-1 text-sm" onClick={weather.retry}>
              <RotateCw className="size-4" /> {copy.common.retry}
            </button>
          </div>
        </div>
      )}

      {live && (
        <div className="mt-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-serif text-6xl leading-none tracking-tight">{live.temperatureNow}°</p>
              <p className="mt-2 text-sm text-muted">{weatherCodeLabel(live.weatherCode) || copy.weather.now}</p>
            </div>
            <div className="text-right text-sm">
              <p>{copy.weather.minMax(live.min, live.max)}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-muted">
                {live.precipitationProbability >= 30 ? <CloudRain className="size-4" /> : <Sun className="size-4" />}
                {copy.weather.rain(live.precipitationProbability)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {copy.weather.morningAfternoon(live.morning.hour, live.morning.temperature, live.afternoon.hour, live.afternoon.temperature)}
              </p>
            </div>
          </div>
        </div>
      )}

      {weather.manualMode && status !== "error" && (
        <p className="mt-3 text-sm text-muted">{copy.weather.manualActive}</p>
      )}
      {useManual && <ManualControls weather={weather} />}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <MapPin className="size-4" /> {locationLabel(weather) || "…"}
        </span>
        <span className="flex gap-1">
          {status === "ready" && (
            <button type="button" className="btn btn-ghost text-sm" onClick={() => weather.setManualMode(!weather.manualMode)}>
              {weather.manualMode ? copy.weather.backToLive : copy.weather.setManually}
            </button>
          )}
          <button type="button" className="btn btn-ghost text-sm" onClick={() => setSearchOpen((v) => !v)} aria-expanded={searchOpen}>
            {copy.weather.changeCity}
          </button>
        </span>
      </div>
      {weather.location?.kind === "default" && (
        <p className="mt-1 text-xs text-muted">{copy.weather.defaultLocationNote}</p>
      )}
      {searchOpen && <CitySearch weather={weather} onDone={() => setSearchOpen(false)} />}
    </section>
  );
}
