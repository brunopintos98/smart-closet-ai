"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/copy/es-AR";
import { getRecommender, pickNextOutfit, type RecommendationResult } from "@/lib/recommendation";
import {
  newId,
  savedOutfitsStore,
  useActiveWardrobe,
  useSavedOutfits,
  wardrobeSourceStore,
} from "@/lib/store/appStore";
import { useWeather } from "@/lib/weather/useWeather";
import type { SavedOutfit, ScoredOutfit } from "@/types/outfit";
import type { Occasion } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/types/weather";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toast";
import { WeatherCard } from "../WeatherCard";
import { ColdStartNotice } from "./ColdStartNotice";
import { OccasionChat } from "./OccasionChat";
import { OccasionPicker } from "./OccasionPicker";
import { OutfitResult } from "./OutfitResult";

function weatherKey(w: WeatherSnapshot | null): string {
  if (!w) return "none";
  return [w.source, w.morning.temperature, w.afternoon.temperature, w.precipitationProbability, w.location?.latitude].join("|");
}

const sameLocalDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

interface Generated {
  key: string;
  result: RecommendationResult;
  current: ScoredOutfit | null;
  shown: Set<string>;
}

export function StudioScreen() {
  const toast = useToast();
  const weather = useWeather();
  const { source, garments } = useActiveWardrobe();
  const saved = useSavedOutfits();
  const recommender = useMemo(() => getRecommender(), []);

  const [occasion, setOccasion] = useState<Occasion>("office");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);

  const inputKey = `${occasion}|${source}|${garments.map((g) => g.id).join(",")}|${weatherKey(weather.weather)}`;

  const generate = async (forOccasion = occasion, forKey = inputKey) => {
    if (!weather.weather) return;
    setBusy(true);
    try {
      const result = await recommender.recommend({
        garments,
        occasion: forOccasion,
        weather: weather.weather,
        recentOutfits: saved,
        now: new Date(),
      });
      const current = result.status === "ok" ? result.outfits[0] : null;
      setGenerated({ key: forKey, result, current, shown: new Set(current ? [current.id] : []) });
    } finally {
      setBusy(false);
    }
  };

  const changeOccasion = (o: Occasion) => {
    setOccasion(o);
    // Keep the result in sync if the user already asked for one.
    if (generated) void generate(o, inputKey.replace(/^[^|]+/, o));
  };

  const tryAnother = () => {
    if (!generated || generated.result.status !== "ok") return;
    const { outfits } = generated.result;
    const next = pickNextOutfit(outfits, generated.shown, generated.current);
    if (!next) {
      toast.show(copy.studio.allShown);
      setGenerated({ ...generated, current: outfits[0], shown: new Set([outfits[0].id]) });
      return;
    }
    setGenerated({ ...generated, current: next, shown: new Set([...generated.shown, next.id]) });
  };

  const current = generated?.current ?? null;
  const isSaved = !!current && saved.some((s) => s.outfitKey === current.id && sameLocalDay(new Date(s.savedAt), new Date()));

  const save = () => {
    if (!current || !weather.weather) return;
    const w = weather.weather;
    const garmentsInOutfit = Object.values(current.pieces).filter((g) => g !== undefined);
    const entry: SavedOutfit = {
      id: newId("outfit"),
      outfitKey: current.id,
      garmentIds: garmentsInOutfit.map((g) => g.id),
      garments: garmentsInOutfit,
      occasion,
      weather: {
        temperatureNow: w.temperatureNow,
        min: w.min,
        max: w.max,
        precipitationProbability: w.precipitationProbability,
        source: w.source,
        locationName: weather.location?.kind === "geo" ? copy.weather.currentLocation : weather.location?.location.name,
      },
      savedAt: new Date().toISOString(),
    };
    savedOutfitsStore.set((prev) => [entry, ...prev]);
    toast.show(copy.studio.savedToast);
  };

  const position = generated?.result.status === "ok" && current ? generated.result.outfits.indexOf(current) + 1 : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow">{copy.studio.eyebrow}</p>
          <StatusBadge status="working" />
        </div>
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">{copy.studio.title}</h1>
        <p className="max-w-prose text-muted">{copy.studio.subtitle}</p>
      </header>

      <WeatherCard weather={weather} />
      <OccasionChat onDetected={changeOccasion} />
      <OccasionPicker value={occasion} onChange={changeOccasion} />

      <div className="space-y-2">
        <button
          type="button"
          className="btn btn-primary w-full py-4 text-base"
          onClick={() => generate()}
          disabled={!weather.weather || busy}
        >
          <Sparkles className="size-5" /> {copy.studio.generate}
        </button>
        <p className="text-center text-xs text-muted">
          {source === "sample" ? copy.studio.usingSample : copy.studio.usingMine}{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-ink"
            onClick={() => wardrobeSourceStore.set(source === "sample" ? "mine" : "sample")}
          >
            {copy.studio.switchWardrobe}
          </button>
        </p>
      </div>

      {generated?.result.status === "insufficient" && (
        <ColdStartNotice
          occasion={generated.result.occasion}
          missing={generated.result.missing}
          canUseSample={source === "mine"}
          onUseSample={() => {
            wardrobeSourceStore.set("sample");
            setGenerated(null);
          }}
        />
      )}

      {generated?.result.status === "ok" && current && (
        <OutfitResult
          outfit={current}
          position={position}
          total={generated.result.outfits.length}
          isSaved={isSaved}
          stale={generated.key !== inputKey}
          onTryAnother={tryAnother}
          onSave={save}
        />
      )}
    </div>
  );
}
