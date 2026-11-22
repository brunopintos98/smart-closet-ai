"use client";

import { useSyncExternalStore } from "react";
import { createPersistentStore, type PersistentStore } from "@/lib/storage/local";
import { SAMPLE_WARDROBE } from "@/lib/wardrobe/sampleWardrobe";
import type { SavedOutfit } from "@/types/outfit";
import type { Garment, WardrobeSource } from "@/types/wardrobe";
import type { WeatherLocation } from "@/types/weather";

const KEY_PREFIX = "smart-closet:v1:";

const isArray = <T,>(v: unknown): v is T[] => Array.isArray(v);
const isSource = (v: unknown): v is WardrobeSource => v === "sample" || v === "mine";

export const garmentsStore = createPersistentStore<Garment[]>(`${KEY_PREFIX}garments`, [], isArray<Garment>);
export const savedOutfitsStore = createPersistentStore<SavedOutfit[]>(`${KEY_PREFIX}saved`, [], isArray<SavedOutfit>);
export const wardrobeSourceStore = createPersistentStore<WardrobeSource>(`${KEY_PREFIX}source`, "sample", isSource);

function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export const useMyGarments = () => useStore(garmentsStore);
export const useSavedOutfits = () => useStore(savedOutfitsStore);
export const useWardrobeSource = () => useStore(wardrobeSourceStore);

/** The wardrobe the recommender should use right now. */
export function useActiveWardrobe(): { source: WardrobeSource; garments: Garment[] } {
  const source = useWardrobeSource();
  const mine = useMyGarments();
  return { source, garments: source === "sample" ? SAMPLE_WARDROBE : mine };
}

export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

const isLocation = (v: unknown): v is WeatherLocation | null =>
  v === null ||
  (typeof v === "object" && v !== null && "latitude" in v && "longitude" in v && "name" in v);

/** City picked with the search box; null means "use geolocation". */
export const chosenLocationStore = createPersistentStore<WeatherLocation | null>(
  `${KEY_PREFIX}location`,
  null,
  isLocation,
);
