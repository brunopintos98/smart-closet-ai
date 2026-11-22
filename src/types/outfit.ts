import type { Garment, Occasion } from "./wardrobe";
import type { WeatherSnapshot } from "./weather";

export interface OutfitPieces {
  top?: Garment;
  bottom?: Garment;
  onePiece?: Garment;
  outerwear?: Garment;
  footwear: Garment;
}

/**
 * Explanations are structured (code + params) so the recommender stays free
 * of UI text. The copy file turns them into Spanish sentences.
 */
export type Reason =
  | { code: "formalityMatch"; occasion: Occasion }
  | { code: "addedOuterwearCold"; garment: string; hour: number; temperature: number }
  | { code: "addedOuterwearRain"; garment: string; probability: number }
  | { code: "skippedOuterwearWarm"; temperature: number }
  | { code: "lightLayersHeat"; hour: number; temperature: number }
  | { code: "warmLayersCold"; hour: number; temperature: number }
  | { code: "avoidedNonRainFootwear"; garment: string; probability: number }
  | { code: "rainFriendlyFootwear"; garment: string; probability: number }
  | { code: "neutralBase" }
  | { code: "accentOnNeutral"; garment: string }
  | { code: "sameColorFamily" }
  | { code: "goodContrast" }
  | { code: "notWornRecently" }
  /** Reserved for V2: an LLM can return its own explanation. */
  | { code: "freeText"; text: string };

export type RuleId =
  | "formality"
  | "warmth"
  | "outerwear"
  | "rain"
  | "color"
  | "repetition";

export type RuleViolation =
  | { rule: "formality"; occasion: Occasion; garment: string }
  | { rule: "warmth"; garment: string; hour: number; temperature: number; direction: "tooWarm" | "tooLight" }
  | { rule: "outerwear"; hour: number; temperature: number; needed: "warmer" | "any" }
  | { rule: "rain"; garment: string; probability: number }
  | { rule: "color"; kind: "clash" | "tooMany" }
  | { rule: "repetition"; daysAgo: number };

export interface ScoredOutfit {
  /** Stable id: sorted garment ids. Same pieces → same id. */
  id: string;
  pieces: OutfitPieces;
  /** 0-100. */
  score: number;
  reasons: Reason[];
  violations: RuleViolation[];
}

export interface SavedOutfit {
  id: string;
  outfitKey: string;
  garmentIds: string[];
  /** Snapshot of the garments so the list survives later edits/deletes. */
  garments: Garment[];
  occasion: Occasion;
  weather: Pick<
    WeatherSnapshot,
    "temperatureNow" | "min" | "max" | "precipitationProbability" | "source"
  > & { locationName?: string };
  savedAt: string;
}

/** Minimal view of a saved outfit the recommender needs to avoid repeats. */
export interface RecentOutfit {
  outfitKey: string;
  garmentIds: string[];
  savedAt: string;
}
