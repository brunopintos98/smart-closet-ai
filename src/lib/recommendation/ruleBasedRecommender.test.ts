import { describe, expect, it } from "vitest";
import { OCCASIONS } from "@/types/wardrobe";
import type { RecentOutfit, ScoredOutfit } from "@/types/outfit";
import { SAMPLE_WARDROBE } from "@/lib/wardrobe/sampleWardrobe";
import {
  pickNextOutfit,
  recommendOutfits,
  RuleBasedRecommender,
} from "./ruleBasedRecommender";
import { colorRule, outfitKey } from "./rules";
import { garment, weather } from "./testUtils";
import type { RecommendationInput } from "./types";

const NOW = new Date("2026-11-22T12:00:00.000Z");

function input(over: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    garments: SAMPLE_WARDROBE,
    occasion: "office",
    weather: weather(),
    recentOutfits: [],
    now: NOW,
    ...over,
  };
}

function okResult(i: RecommendationInput) {
  const r = recommendOutfits(i);
  if (r.status !== "ok") throw new Error(`expected ok, got ${JSON.stringify(r)}`);
  return r;
}

describe("cold start / insufficient wardrobe", () => {
  it("reports every missing category for an empty wardrobe", () => {
    const r = recommendOutfits(input({ garments: [] }));
    expect(r).toEqual({
      status: "insufficient",
      occasion: "office",
      missing: ["top", "bottom", "footwear"],
    });
  });

  it("accepts a one-piece garment instead of top + bottom", () => {
    const r = recommendOutfits(
      input({ garments: [garment({ category: "onePiece" }), garment({ category: "footwear" })] }),
    );
    expect(r.status).toBe("ok");
  });

  it("only counts garments suitable for the occasion", () => {
    const officeOnly = ["top", "bottom", "footwear"].map((category) =>
      garment({ category: category as "top", occasions: ["office"] }),
    );
    const r = recommendOutfits(input({ garments: officeOnly, occasion: "sport" }));
    expect(r.status).toBe("insufficient");
    if (r.status === "insufficient") expect(r.missing).toEqual(["top", "bottom", "footwear"]);
  });

  it("works for every occasion with the sample wardrobe", () => {
    for (const occasion of OCCASIONS) {
      for (const w of [weather({ morning: 4, afternoon: 9 }), weather({ morning: 25, afternoon: 31 }), weather({ rain: 80 })]) {
        expect(recommendOutfits(input({ occasion, weather: w })).status).toBe("ok");
      }
    }
  });
});

describe("temperature", () => {
  it("adds outerwear when the morning is cold and explains it with hour and temperature", () => {
    const r = okResult(input({ weather: weather({ morning: 11, afternoon: 15 }) }));
    const best = r.outfits[0];
    expect(best.pieces.outerwear).toBeDefined();
    expect(best.reasons).toContainEqual({
      code: "addedOuterwearCold",
      garment: best.pieces.outerwear!.name,
      hour: 9,
      temperature: 11,
    });
  });

  it("uses the morning temperature, not only the afternoon one", () => {
    const r = okResult(input({ weather: weather({ morning: 10, afternoon: 23 }) }));
    expect(r.outfits.every((o) => o.pieces.outerwear !== undefined)).toBe(true);
  });

  it("picks the warmest coat when it is freezing", () => {
    const r = okResult(input({ weather: weather({ morning: 3, afternoon: 8 }) }));
    expect(r.outfits[0].pieces.outerwear?.warmth).toBe("warm");
  });

  it("skips outerwear and prefers light layers on a hot day", () => {
    const r = okResult(input({ occasion: "casual", weather: weather({ morning: 24, afternoon: 31 }) }));
    const best = r.outfits[0];
    expect(best.pieces.outerwear).toBeUndefined();
    expect(best.pieces.top?.warmth).toBe("light");
    expect(best.reasons.map((x) => x.code)).toContain("skippedOuterwearWarm");
  });

  it("flags a missing coat when it is cold and no outerwear fits", () => {
    const garments = [
      garment({ category: "top" }),
      garment({ category: "bottom" }),
      garment({ category: "footwear" }),
    ];
    const r = okResult(input({ garments, weather: weather({ morning: 6, afternoon: 10 }) }));
    expect(r.bestEffort).toBe(true);
    expect(r.outfits[0].violations).toContainEqual({ rule: "outerwear", hour: 9, temperature: 6, needed: "any" });
  });
});

describe("rain", () => {
  it("avoids suede shoes when rain is likely and says so", () => {
    const r = okResult(input({ weather: weather({ rain: 70 }) }));
    const best = r.outfits[0];
    expect(best.pieces.footwear.rainFriendly).toBe(true);
    expect(best.reasons).toContainEqual({
      code: "avoidedNonRainFootwear",
      garment: "Mocasines de gamuza",
      probability: 70,
    });
  });

  it("adds outerwear for rain even on a mild day", () => {
    const r = okResult(input({ occasion: "casual", weather: weather({ morning: 20, afternoon: 24, rain: 80 }) }));
    expect(r.outfits[0].pieces.outerwear?.rainFriendly).toBe(true);
  });

  it("returns the best possible outfit and the broken rule when no shoe suits the rain", () => {
    const garments = [
      garment({ category: "top" }),
      garment({ category: "bottom" }),
      garment({ category: "outerwear" }),
      garment({ category: "footwear", name: "Zapatos de gamuza", rainFriendly: false }),
    ];
    const r = okResult(input({ garments, weather: weather({ rain: 90 }) }));
    expect(r.bestEffort).toBe(true);
    expect(r.outfits[0].violations).toContainEqual({ rule: "rain", garment: "Zapatos de gamuza", probability: 90 });
  });

  it("ignores rain below 30 %", () => {
    const r = okResult(input({ weather: weather({ rain: 20 }) }));
    expect(r.outfits[0].violations).toEqual([]);
  });
});

describe("formality", () => {
  it("keeps every piece within the formal range for a formal event", () => {
    const r = okResult(input({ occasion: "formal" }));
    for (const g of Object.values(r.outfits[0].pieces)) {
      if (g) expect(g.formality).toBeGreaterThanOrEqual(4);
    }
    expect(r.outfits[0].reasons).toContainEqual({ code: "formalityMatch", occasion: "formal" });
  });

  it("ranks a matching outfit above a too-casual one", () => {
    const garments = [
      garment({ id: "tee", category: "top", formality: 1 }),
      garment({ id: "shirt", category: "top", formality: 4 }),
      garment({ id: "pants", category: "bottom", formality: 4 }),
      garment({ id: "shoes", category: "footwear", formality: 4 }),
    ];
    const r = okResult(input({ garments, occasion: "office", weather: weather({ morning: 20 }) }));
    expect(r.outfits[0].pieces.top?.id).toBe("shirt");
    expect(r.outfits[1].violations.some((v) => v.rule === "formality")).toBe(true);
  });
});

describe("colors", () => {
  const top = (color: "red" | "green" | "white" | "lightBlue" | "orange" | "yellow" | "pink") =>
    garment({ category: "top", color });
  const shoe = garment({ category: "footwear", color: "black" });

  it("rewards a neutral base", () => {
    expect(colorRule({ top: top("white"), bottom: garment({ category: "bottom", color: "black" }), footwear: shoe }).reasons)
      .toEqual([{ code: "neutralBase" }]);
  });

  it("prefers one accent over all neutrals", () => {
    const one = colorRule({ top: top("red"), bottom: garment({ category: "bottom", color: "black" }), footwear: shoe });
    const none = colorRule({ top: top("white"), bottom: garment({ category: "bottom", color: "black" }), footwear: shoe });
    expect(one.score).toBeGreaterThan(none.score);
  });

  it("flags clashing accents", () => {
    const r = colorRule({ top: top("red"), bottom: garment({ category: "bottom", color: "green" }), footwear: shoe });
    expect(r.violations).toEqual([{ rule: "color", kind: "clash" }]);
  });

  it("accepts known contrasts and same-family accents", () => {
    expect(colorRule({ top: top("lightBlue"), bottom: garment({ category: "bottom", color: "orange" }), footwear: shoe }).violations).toEqual([]);
    expect(colorRule({ top: top("red"), bottom: garment({ category: "bottom", color: "pink" }), footwear: shoe }).violations).toEqual([]);
  });

  it("flags three or more accents", () => {
    const r = colorRule({ top: top("red"), bottom: garment({ category: "bottom", color: "green" }), footwear: garment({ category: "footwear", color: "yellow" }) });
    expect(r.violations).toEqual([{ rule: "color", kind: "tooMany" }]);
  });
});

describe("repetition", () => {
  const recentFrom = (o: ScoredOutfit, daysAgo: number): RecentOutfit => ({
    outfitKey: o.id,
    garmentIds: o.id.split("+"),
    savedAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  });

  it("does not suggest first an outfit saved in the last days", () => {
    const first = okResult(input()).outfits[0];
    const again = okResult(input({ recentOutfits: [recentFrom(first, 2)] }));
    expect(again.outfits[0].id).not.toBe(first.id);
    const repeated = again.outfits.find((o) => o.id === first.id)!;
    expect(repeated.violations).toContainEqual({ rule: "repetition", daysAgo: 2 });
  });

  it("forgets outfits saved more than a week ago", () => {
    const first = okResult(input()).outfits[0];
    const again = okResult(input({ recentOutfits: [recentFrom(first, 10)] }));
    expect(again.outfits[0].id).toBe(first.id);
  });
});

describe("ranking and 'Probá otra'", () => {
  it("is deterministic and sorted by score", () => {
    const a = okResult(input());
    const b = okResult(input());
    expect(a.outfits.map((o) => o.id)).toEqual(b.outfits.map((o) => o.id));
    const scores = a.outfits.map((o) => o.score);
    expect([...scores].sort((x, y) => y - x)).toEqual(scores);
  });

  it("builds stable ids regardless of piece order", () => {
    const t = garment({ id: "b", category: "top" });
    const s = garment({ id: "a", category: "footwear" });
    expect(outfitKey({ top: t, footwear: s })).toBe("a+b");
  });

  it("never repeats and changes at least two pieces when possible", () => {
    const { outfits } = okResult(input({ occasion: "dinner" }));
    const shown = new Set<string>([outfits[0].id]);
    const next = pickNextOutfit(outfits, shown, outfits[0])!;
    expect(next.id).not.toBe(outfits[0].id);
    const common = next.id.split("+").filter((id) => outfits[0].id.includes(id)).length;
    expect(outfits[0].id.split("+").length - common).toBeGreaterThanOrEqual(2);
  });

  it("returns null when every option was shown", () => {
    const { outfits } = okResult(input());
    expect(pickNextOutfit(outfits, new Set(outfits.map((o) => o.id)), outfits[0])).toBeNull();
  });

  it("exposes the same result through the async interface", async () => {
    const engine = new RuleBasedRecommender();
    await expect(engine.recommend(input())).resolves.toEqual(recommendOutfits(input()));
  });
});
