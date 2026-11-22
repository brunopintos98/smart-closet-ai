import type { ColorId } from "@/types/wardrobe";

export type ColorFamily = "neutral" | "warm" | "cool";

export interface ColorInfo {
  hex: string;
  family: ColorFamily;
}

/**
 * Simple, explainable color model: neutrals go with everything; accents are
 * grouped into warm/cool families. Denim, navy and olive count as neutrals
 * because they behave like basics in everyday outfits.
 */
export const COLORS: Record<ColorId, ColorInfo> = {
  black: { hex: "#1f1f1f", family: "neutral" },
  white: { hex: "#f4f2ee", family: "neutral" },
  gray: { hex: "#9a9a9a", family: "neutral" },
  navy: { hex: "#26324d", family: "neutral" },
  beige: { hex: "#dccbb0", family: "neutral" },
  camel: { hex: "#b98a57", family: "neutral" },
  brown: { hex: "#6b4a34", family: "neutral" },
  denim: { hex: "#4d6a8f", family: "neutral" },
  olive: { hex: "#6b6b3e", family: "neutral" },
  red: { hex: "#c0392b", family: "warm" },
  burgundy: { hex: "#7a2335", family: "warm" },
  yellow: { hex: "#e3b23c", family: "warm" },
  pink: { hex: "#e8a1b0", family: "warm" },
  orange: { hex: "#d9773a", family: "warm" },
  green: { hex: "#2f7d5b", family: "cool" },
  lightBlue: { hex: "#9cc3e0", family: "cool" },
  purple: { hex: "#6d4c8f", family: "cool" },
};

/** Accent pairs from different families that still work well together. */
const GOOD_CONTRASTS: ReadonlyArray<readonly [ColorId, ColorId]> = [
  ["lightBlue", "orange"],
  ["lightBlue", "yellow"],
  ["lightBlue", "burgundy"],
  ["purple", "yellow"],
  ["green", "pink"],
];

export function isNeutral(color: ColorId): boolean {
  return COLORS[color].family === "neutral";
}

export function isGoodContrast(a: ColorId, b: ColorId): boolean {
  return GOOD_CONTRASTS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}
