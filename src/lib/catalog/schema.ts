import { z } from "zod";
import {
  COLOR_IDS,
  GARMENT_CATEGORIES,
  GARMENT_KINDS,
  OCCASIONS,
  WARMTH_LEVELS,
  type ColorId,
  type Formality,
  type GarmentCategory,
  type GarmentKind,
  type Occasion,
  type Warmth,
} from "@/types/wardrobe";

/**
 * Shape the model must return (structured outputs). Kept loose on numbers
 * and cross-field rules; `normalizeCatalogOutput` enforces those afterwards.
 */
export const CatalogOutputSchema = z.object({
  isGarment: z.boolean(),
  name: z.string(),
  category: z.enum(GARMENT_CATEGORIES),
  kind: z.enum(GARMENT_KINDS),
  color: z.enum(COLOR_IDS),
  warmth: z.enum(WARMTH_LEVELS),
  formality: z.number().int(),
  occasions: z.array(z.enum(OCCASIONS)),
  rainFriendly: z.boolean(),
});

export type CatalogOutput = z.infer<typeof CatalogOutputSchema>;

/** What the form receives: every field ready to drop into a garment draft. */
export interface CatalogSuggestion {
  name: string;
  category: GarmentCategory;
  kind?: GarmentKind;
  color: ColorId;
  warmth: Warmth;
  formality: Formality;
  occasions: Occasion[];
  rainFriendly: boolean;
}

/** Kinds that make sense for each category (mirrors the form's choices). */
export const KINDS_FOR_CATEGORY: Record<GarmentCategory, readonly GarmentKind[]> = {
  top: ["tshirt", "shirt", "sweater"],
  bottom: ["pants", "jeans", "skirt", "shorts"],
  outerwear: ["jacket", "blazer", "coat", "raincoat"],
  footwear: ["sneakers", "boots", "loafers", "heels"],
  onePiece: ["dress"],
};

const MAX_NAME_LENGTH = 60;

/**
 * Validates the model output and repairs what can be repaired safely.
 * Returns null when the photo is not a garment or the output is unusable,
 * so the caller falls back to the manual form.
 */
export function normalizeCatalogOutput(raw: unknown): CatalogSuggestion | null {
  const parsed = CatalogOutputSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.isGarment) return null;
  const o = parsed.data;

  const name = o.name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  if (!name) return null;

  const formality = Math.min(5, Math.max(1, Math.round(o.formality))) as Formality;
  const occasions = [...new Set(o.occasions)];
  const kind = KINDS_FOR_CATEGORY[o.category].includes(o.kind) ? o.kind : undefined;

  return {
    name,
    category: o.category,
    kind,
    color: o.color,
    warmth: o.warmth,
    formality,
    // An empty list would fail form validation; let the user pick instead.
    occasions,
    rainFriendly: o.rainFriendly,
  };
}
