import type { Garment, GarmentCategory, Occasion } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/types/weather";
import type { RecentOutfit, ScoredOutfit } from "@/types/outfit";

export interface RecommendationInput {
  garments: Garment[];
  occasion: Occasion;
  weather: WeatherSnapshot;
  /** Saved outfits, used to avoid repeating recent looks. */
  recentOutfits: RecentOutfit[];
  /** Injected for deterministic tests. */
  now: Date;
}

export type RecommendationResult =
  | {
      status: "ok";
      /** Sorted best first. The first item may still break some rules. */
      outfits: ScoredOutfit[];
      /** True when not even the best outfit meets every rule. */
      bestEffort: boolean;
    }
  | {
      status: "insufficient";
      occasion: Occasion;
      /** Categories with no garment suitable for the occasion. */
      missing: GarmentCategory[];
    };

/**
 * Extension point between the UI and the recommendation engine.
 *
 * V1: RuleBasedRecommender (pure, deterministic, offline).
 * V2: an LlmRecommender will implement this same interface and fall back to
 * the rule-based one on error, timeout or invalid output. The UI only depends
 * on this interface, so swapping engines does not touch components.
 * The method is async on purpose so a network-backed engine fits as is.
 */
export interface OutfitRecommender {
  readonly id: string;
  recommend(input: RecommendationInput): Promise<RecommendationResult>;
}
