import type { Garment, Occasion, Warmth } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/types/weather";
import type {
  OutfitPieces,
  Reason,
  RecentOutfit,
  RuleViolation,
} from "@/types/outfit";
import { COLORS, isGoodContrast } from "./colors";

/**
 * Each rule returns a 0..1 score plus the reasons and violations it found.
 * Rules are pure functions so they can be tested in isolation.
 */
export interface RuleResult {
  score: number;
  reasons: Reason[];
  violations: RuleViolation[];
}

export const RAIN_THRESHOLD = 50;
export const LIGHT_RAIN_THRESHOLD = 30;
export const OUTERWEAR_BELOW = 17;
export const HOT_AFTERNOON_FROM = 24;
export const REPEAT_WINDOW_DAYS = 7;

export const FORMALITY_RANGE: Record<Occasion, readonly [number, number]> = {
  office: [3, 4],
  casual: [1, 3],
  dinner: [3, 4],
  sport: [1, 2],
  formal: [4, 5],
};

const WARMTH_VALUE: Record<Warmth, number> = { light: 1, medium: 2, warm: 3 };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function piecesOf(p: OutfitPieces): Garment[] {
  return [p.top, p.bottom, p.onePiece, p.outerwear, p.footwear].filter(
    (g): g is Garment => g !== undefined,
  );
}

export function outfitKey(p: OutfitPieces): string {
  return piecesOf(p)
    .map((g) => g.id)
    .sort()
    .join("+");
}

function formalityDistance(g: Garment, occasion: Occasion): number {
  const [min, max] = FORMALITY_RANGE[occasion];
  if (g.formality < min) return min - g.formality;
  if (g.formality > max) return g.formality - max;
  return 0;
}

export function formalityRule(p: OutfitPieces, occasion: Occasion): RuleResult {
  const pieces = piecesOf(p);
  const violations: RuleViolation[] = [];
  let total = 0;
  for (const g of pieces) {
    const d = formalityDistance(g, occasion);
    total += clamp01(1 - 0.4 * d);
    if (d >= 2) violations.push({ rule: "formality", occasion, garment: g.name });
  }
  const score = total / pieces.length;
  const reasons: Reason[] =
    score === 1 ? [{ code: "formalityMatch", occasion }] : [];
  return { score, reasons, violations };
}

/** Ideal warmth (1-3) of the base layer for the day's temperatures. */
export function idealBaseWarmth(w: WeatherSnapshot): number {
  if (w.afternoon.temperature >= HOT_AFTERNOON_FROM) return 1;
  if (w.morning.temperature <= 8) return 3;
  if (w.morning.temperature <= 14) return 2;
  return 1.5;
}

/** Required outerwear warmth (1-3), or null when no outerwear is needed. */
export function requiredOuterwearWarmth(w: WeatherSnapshot): number | null {
  const t = w.morning.temperature;
  if (t < 8) return 3;
  if (t < 13) return 2;
  if (t < OUTERWEAR_BELOW) return 1;
  if (w.precipitationProbability >= RAIN_THRESHOLD) return 1;
  return null;
}

function baseLayerScore(
  g: Garment,
  ideal: number,
  w: WeatherSnapshot,
  violations: RuleViolation[],
): number {
  const diff = WARMTH_VALUE[g.warmth] - ideal;
  if (Math.abs(diff) >= 2) {
    const hot = diff > 0;
    violations.push({
      rule: "warmth",
      garment: g.name,
      hour: hot ? w.afternoon.hour : w.morning.hour,
      temperature: hot ? w.afternoon.temperature : w.morning.temperature,
      direction: hot ? "tooWarm" : "tooLight",
    });
  }
  return clamp01(1 - 0.35 * Math.abs(diff));
}

export function warmthRule(p: OutfitPieces, w: WeatherSnapshot): RuleResult {
  const violations: RuleViolation[] = [];
  const reasons: Reason[] = [];
  const ideal = idealBaseWarmth(w);

  const base = p.onePiece ?? p.top;
  const baseScore = base ? baseLayerScore(base, ideal, w, violations) : 1;
  // Bottoms matter less for comfort than the upper layer.
  const bottomScore = p.bottom
    ? 0.5 + 0.5 * baseLayerScore(p.bottom, ideal, w, violations)
    : 1;

  let outerScore = 1;
  const required = requiredOuterwearWarmth(w);
  if (required !== null) {
    if (!p.outerwear) {
      outerScore = 0;
      violations.push({
        rule: "outerwear",
        hour: w.morning.hour,
        temperature: w.morning.temperature,
        needed: "any",
      });
    } else {
      const value = WARMTH_VALUE[p.outerwear.warmth];
      const short = Math.max(0, required - value);
      const extra = Math.max(0, value - required);
      outerScore = clamp01(1 - 0.4 * short - 0.15 * extra);
      if (short >= 2) {
        violations.push({
          rule: "outerwear",
          hour: w.morning.hour,
          temperature: w.morning.temperature,
          needed: "warmer",
        });
      }
      if (w.morning.temperature < OUTERWEAR_BELOW) {
        reasons.push({
          code: "addedOuterwearCold",
          garment: p.outerwear.name,
          hour: w.morning.hour,
          temperature: w.morning.temperature,
        });
      } else {
        reasons.push({
          code: "addedOuterwearRain",
          garment: p.outerwear.name,
          probability: w.precipitationProbability,
        });
      }
    }
  }

  if (ideal === 1 && base && base.warmth === "light") {
    reasons.push({
      code: "lightLayersHeat",
      hour: w.afternoon.hour,
      temperature: w.afternoon.temperature,
    });
  } else if (ideal === 3 && base && base.warmth === "warm" && !p.outerwear) {
    reasons.push({
      code: "warmLayersCold",
      hour: w.morning.hour,
      temperature: w.morning.temperature,
    });
  }

  const score = 0.45 * baseScore + 0.2 * bottomScore + 0.35 * outerScore;
  return { score, reasons, violations };
}

export function rainRule(
  p: OutfitPieces,
  w: WeatherSnapshot,
  availableFootwear: Garment[],
): RuleResult {
  const prob = w.precipitationProbability;
  if (prob < LIGHT_RAIN_THRESHOLD) return { score: 1, reasons: [], violations: [] };

  const reasons: Reason[] = [];
  const violations: RuleViolation[] = [];
  const shoe = p.footwear;
  let score = 1;

  if (prob >= RAIN_THRESHOLD) {
    if (!shoe.rainFriendly) {
      score = 0.1;
      violations.push({ rule: "rain", garment: shoe.name, probability: prob });
    } else {
      const avoided = availableFootwear.find((g) => !g.rainFriendly);
      reasons.push(
        avoided
          ? { code: "avoidedNonRainFootwear", garment: avoided.name, probability: prob }
          : { code: "rainFriendlyFootwear", garment: shoe.name, probability: prob },
      );
    }
    if (p.outerwear && !p.outerwear.rainFriendly) score -= 0.2;
  } else if (!shoe.rainFriendly) {
    score = 0.7;
  }
  return { score: clamp01(score), reasons, violations };
}

export function colorRule(p: OutfitPieces): RuleResult {
  const pieces = piecesOf(p);
  const accents = pieces.filter((g) => COLORS[g.color].family !== "neutral");
  const distinct = [...new Set(accents.map((g) => g.color))];

  if (distinct.length === 0) {
    return { score: 0.85, reasons: [{ code: "neutralBase" }], violations: [] };
  }
  if (distinct.length === 1) {
    return {
      score: 1,
      reasons: [{ code: "accentOnNeutral", garment: accents[0].name }],
      violations: [],
    };
  }
  if (distinct.length === 2) {
    const [a, b] = distinct;
    if (COLORS[a].family === COLORS[b].family) {
      return { score: 0.75, reasons: [{ code: "sameColorFamily" }], violations: [] };
    }
    if (isGoodContrast(a, b)) {
      return { score: 0.8, reasons: [{ code: "goodContrast" }], violations: [] };
    }
    return { score: 0.35, reasons: [], violations: [{ rule: "color", kind: "clash" }] };
  }
  return { score: 0.2, reasons: [], violations: [{ rule: "color", kind: "tooMany" }] };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function repetitionRule(
  p: OutfitPieces,
  recent: RecentOutfit[],
  now: Date,
): RuleResult {
  const windowStart = now.getTime() - REPEAT_WINDOW_DAYS * DAY_MS;
  const inWindow = recent.filter((r) => {
    const t = new Date(r.savedAt).getTime();
    return t >= windowStart && t <= now.getTime();
  });
  if (inWindow.length === 0) return { score: 1, reasons: [], violations: [] };

  const key = outfitKey(p);
  const exact = inWindow
    .filter((r) => r.outfitKey === key)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
  if (exact) {
    const daysAgo = Math.floor((now.getTime() - new Date(exact.savedAt).getTime()) / DAY_MS);
    return { score: 0, reasons: [], violations: [{ rule: "repetition", daysAgo }] };
  }

  const core = [p.onePiece?.id, p.top?.id, p.bottom?.id].filter(Boolean) as string[];
  const sharesCore = inWindow.some((r) => core.every((id) => r.garmentIds.includes(id)));
  if (sharesCore) return { score: 0.5, reasons: [], violations: [] };

  return { score: 1, reasons: [{ code: "notWornRecently" }], violations: [] };
}
