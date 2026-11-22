import { RuleBasedRecommender } from "./ruleBasedRecommender";
import type { OutfitRecommender } from "./types";

export type { OutfitRecommender, RecommendationInput, RecommendationResult } from "./types";
export { detectOccasion } from "./occasionKeywords";
export { findMissingCategories, pickNextOutfit } from "./ruleBasedRecommender";
export { outfitKey } from "./rules";

/**
 * Single place where the app chooses its engine.
 * V2: return `new LlmRecommender({ fallback: new RuleBasedRecommender() })`
 * here (behind a feature flag) without changing any component.
 */
export function getRecommender(): OutfitRecommender {
  return new RuleBasedRecommender();
}
