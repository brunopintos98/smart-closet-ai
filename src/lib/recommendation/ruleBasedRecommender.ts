import type { Garment, GarmentCategory, Occasion } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/types/weather";
import type { OutfitPieces, Reason, ScoredOutfit } from "@/types/outfit";
import type {
  OutfitRecommender,
  RecommendationInput,
  RecommendationResult,
} from "./types";
import {
  colorRule,
  formalityRule,
  idealBaseWarmth,
  outfitKey,
  rainRule,
  repetitionRule,
  requiredOuterwearWarmth,
  type RuleResult,
  warmthRule,
} from "./rules";

export const RULE_WEIGHTS = {
  formality: 0.25,
  warmth: 0.25,
  rain: 0.15,
  color: 0.2,
  repetition: 0.15,
} as const;

/** Points subtracted per broken rule so compliant outfits rank first. */
const VIOLATION_PENALTY = 15;
/** Max garments per category kept before combining, to bound the search. */
const MAX_PER_CATEGORY = 12;
const MAX_REASONS = 4;

const REASON_PRIORITY: Record<Reason["code"], number> = {
  addedOuterwearCold: 0,
  addedOuterwearRain: 1,
  avoidedNonRainFootwear: 2,
  rainFriendlyFootwear: 3,
  lightLayersHeat: 4,
  warmLayersCold: 5,
  skippedOuterwearWarm: 6,
  formalityMatch: 7,
  accentOnNeutral: 8,
  goodContrast: 9,
  sameColorFamily: 10,
  neutralBase: 11,
  notWornRecently: 12,
  freeText: 13,
};

function byCategory(garments: Garment[], occasion: Occasion) {
  const suitable = garments.filter((g) => g.occasions.includes(occasion));
  const of = (c: GarmentCategory) => suitable.filter((g) => g.category === c);
  return {
    top: of("top"),
    bottom: of("bottom"),
    onePiece: of("onePiece"),
    outerwear: of("outerwear"),
    footwear: of("footwear"),
  };
}

export function findMissingCategories(
  garments: Garment[],
  occasion: Occasion,
): GarmentCategory[] {
  const c = byCategory(garments, occasion);
  const missing: GarmentCategory[] = [];
  const hasSeparates = c.top.length > 0 && c.bottom.length > 0;
  if (!hasSeparates && c.onePiece.length === 0) {
    if (c.top.length === 0) missing.push("top");
    if (c.bottom.length === 0) missing.push("bottom");
  }
  if (c.footwear.length === 0) missing.push("footwear");
  return missing;
}

/** Cheap single-garment pre-score used to trim large wardrobes. */
function preScore(g: Garment, occasion: Occasion, w: WeatherSnapshot): number {
  const f = formalityRule({ footwear: g }, occasion).score;
  const ideal = idealBaseWarmth(w);
  const warmthValue = { light: 1, medium: 2, warm: 3 }[g.warmth];
  const warmth = 1 - Math.abs(warmthValue - ideal) / 3;
  const rain =
    g.category === "footwear" && w.precipitationProbability >= 50 && !g.rainFriendly
      ? 0
      : 1;
  return f + warmth + rain;
}

function trim(list: Garment[], occasion: Occasion, w: WeatherSnapshot): Garment[] {
  if (list.length <= MAX_PER_CATEGORY) return list;
  return [...list]
    .sort((a, b) => preScore(b, occasion, w) - preScore(a, occasion, w) || a.id.localeCompare(b.id))
    .slice(0, MAX_PER_CATEGORY);
}

export function scoreOutfit(
  pieces: OutfitPieces,
  input: RecommendationInput,
  availableFootwear: Garment[],
): ScoredOutfit {
  const results: Record<keyof typeof RULE_WEIGHTS, RuleResult> = {
    formality: formalityRule(pieces, input.occasion),
    warmth: warmthRule(pieces, input.weather),
    rain: rainRule(pieces, input.weather, availableFootwear),
    color: colorRule(pieces),
    repetition: repetitionRule(pieces, input.recentOutfits, input.now),
  };

  let weighted = 0;
  const reasons: Reason[] = [];
  const violations = [];
  for (const key of Object.keys(RULE_WEIGHTS) as (keyof typeof RULE_WEIGHTS)[]) {
    weighted += RULE_WEIGHTS[key] * results[key].score;
    reasons.push(...results[key].reasons);
    violations.push(...results[key].violations);
  }

  const score = Math.max(
    0,
    Math.round(weighted * 100 - VIOLATION_PENALTY * violations.length),
  );
  reasons.sort((a, b) => REASON_PRIORITY[a.code] - REASON_PRIORITY[b.code]);

  return {
    id: outfitKey(pieces),
    pieces,
    score,
    reasons: reasons.slice(0, MAX_REASONS),
    violations,
  };
}

/** Pure, synchronous core. Exported for tests and for the V2 fallback. */
export function recommendOutfits(input: RecommendationInput): RecommendationResult {
  const { garments, occasion, weather } = input;
  const missing = findMissingCategories(garments, occasion);
  if (missing.length > 0) return { status: "insufficient", occasion, missing };

  const c = byCategory(garments, occasion);
  const tops = trim(c.top, occasion, weather);
  const bottoms = trim(c.bottom, occasion, weather);
  const onePieces = trim(c.onePiece, occasion, weather);
  const footwear = trim(c.footwear, occasion, weather);
  const outerwear = trim(c.outerwear, occasion, weather);

  const bases: Pick<OutfitPieces, "top" | "bottom" | "onePiece">[] = [];
  for (const top of tops) for (const bottom of bottoms) bases.push({ top, bottom });
  for (const onePiece of onePieces) bases.push({ onePiece });

  const needsOuterwear = requiredOuterwearWarmth(weather) !== null;
  // If outerwear is needed but none fits the occasion, we still recommend
  // without it and the warmth rule reports the gap.
  const outerOptions: (Garment | undefined)[] =
    needsOuterwear && outerwear.length > 0 ? outerwear : [undefined];

  const outfits: ScoredOutfit[] = [];
  for (const base of bases) {
    for (const shoe of footwear) {
      for (const outer of outerOptions) {
        const scored = scoreOutfit(
          { ...base, footwear: shoe, outerwear: outer },
          input,
          c.footwear,
        );
        if (!needsOuterwear && c.outerwear.length > 0) {
          const skipped: Reason = {
            code: "skippedOuterwearWarm",
            temperature: weather.morning.temperature,
          };
          scored.reasons = [...scored.reasons.slice(0, MAX_REASONS - 1), skipped].sort(
            (a, b) => REASON_PRIORITY[a.code] - REASON_PRIORITY[b.code],
          );
        }
        outfits.push(scored);
      }
    }
  }

  outfits.sort(
    (a, b) =>
      b.score - a.score ||
      a.violations.length - b.violations.length ||
      a.id.localeCompare(b.id),
  );

  return {
    status: "ok",
    outfits,
    bestEffort: outfits[0].violations.length > 0,
  };
}

/** How many pieces two outfits have in common. */
function sharedPieces(a: ScoredOutfit, b: ScoredOutfit): number {
  const ids = new Set(a.id.split("+"));
  return b.id.split("+").filter((id) => ids.has(id)).length;
}

/**
 * Picks the next outfit for "Probá otra": the best one not shown yet that
 * changes at least two pieces from the current one; if none, the best one
 * not shown yet. Returns null once every outfit has been shown.
 */
export function pickNextOutfit(
  ranked: ScoredOutfit[],
  shownIds: ReadonlySet<string>,
  current: ScoredOutfit | null,
): ScoredOutfit | null {
  const unseen = ranked.filter((o) => !shownIds.has(o.id));
  if (unseen.length === 0) return null;
  if (!current) return unseen[0];
  const currentSize = current.id.split("+").length;
  const different = unseen.find((o) => currentSize - sharedPieces(current, o) >= 2);
  return different ?? unseen[0];
}

export class RuleBasedRecommender implements OutfitRecommender {
  readonly id = "rule-based-v1";

  async recommend(input: RecommendationInput): Promise<RecommendationResult> {
    return recommendOutfits(input);
  }
}
