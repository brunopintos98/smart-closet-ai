"use client";

import Link from "next/link";
import { CloudRain, MapPin, Trash2 } from "lucide-react";
import { copy, occasionLabels } from "@/copy/es-AR";
import { savedOutfitsStore, useSavedOutfits } from "@/lib/store/appStore";
import type { SavedOutfit } from "@/types/outfit";
import { GarmentImage } from "./GarmentImage";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./Toast";

const dateFormat = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });

function SavedCard({ outfit, onDelete }: { outfit: SavedOutfit; onDelete: () => void }) {
  const w = outfit.weather;
  return (
    <li className="animate-rise rounded-3xl bg-surface p-4 ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-muted">{dateFormat.format(new Date(outfit.savedAt))}</p>
          <p className="font-serif text-xl">{occasionLabels[outfit.occasion]}</p>
        </div>
        <button type="button" onClick={onDelete} className="btn btn-ghost -mr-2 p-2 text-danger" aria-label={copy.saved.deleteLabel}>
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>{w.temperatureNow}° · {copy.weather.minMax(w.min, w.max)}</span>
        <span className="inline-flex items-center gap-1"><CloudRain className="size-3.5" /> {copy.weather.rain(w.precipitationProbability)}</span>
        {w.source === "manual" ? (
          <span>({copy.saved.manualWeather})</span>
        ) : (
          w.locationName && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {w.locationName}</span>
        )}
      </p>
      <ul className="mt-3 flex gap-2 overflow-x-auto">
        {outfit.garments.map((g) => (
          <li key={g.id} className="w-20 shrink-0">
            <GarmentImage garment={g} className="aspect-square rounded-xl" />
            <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted">{g.name}</p>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function SavedScreen() {
  const saved = useSavedOutfits();
  const toast = useToast();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow">{copy.saved.eyebrow}</p>
          <StatusBadge status="working" />
        </div>
        <h1 className="font-serif text-4xl tracking-tight">{copy.saved.title}</h1>
      </header>

      {saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-serif text-lg">{copy.saved.empty}</p>
          <p className="mt-1 text-sm text-muted">{copy.saved.emptyHint}</p>
          <Link href="/" className="btn btn-primary mt-4">{copy.saved.goToStudio}</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {saved.map((o) => (
            <SavedCard
              key={o.id}
              outfit={o}
              onDelete={() => {
                savedOutfitsStore.set((list) => list.filter((x) => x.id !== o.id));
                toast.show(copy.saved.deleted);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
