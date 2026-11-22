export const GARMENT_CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "footwear",
  "onePiece",
] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const OCCASIONS = [
  "office",
  "casual",
  "dinner",
  "sport",
  "formal",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const WARMTH_LEVELS = ["light", "medium", "warm"] as const;
export type Warmth = (typeof WARMTH_LEVELS)[number];

export type Formality = 1 | 2 | 3 | 4 | 5;

export const COLOR_IDS = [
  "black",
  "white",
  "gray",
  "navy",
  "beige",
  "camel",
  "brown",
  "denim",
  "olive",
  "red",
  "burgundy",
  "green",
  "lightBlue",
  "yellow",
  "pink",
  "orange",
  "purple",
] as const;
export type ColorId = (typeof COLOR_IDS)[number];

/** Drives which SVG illustration is drawn when a garment has no photo. */
export const GARMENT_KINDS = [
  "tshirt",
  "shirt",
  "sweater",
  "pants",
  "jeans",
  "skirt",
  "shorts",
  "blazer",
  "coat",
  "jacket",
  "raincoat",
  "sneakers",
  "boots",
  "loafers",
  "heels",
  "dress",
] as const;
export type GarmentKind = (typeof GARMENT_KINDS)[number];

export interface Garment {
  id: string;
  name: string;
  category: GarmentCategory;
  kind?: GarmentKind;
  color: ColorId;
  warmth: Warmth;
  formality: Formality;
  occasions: Occasion[];
  rainFriendly: boolean;
  /** Key of the photo blob in IndexedDB, if the user uploaded one. */
  photoId?: string;
  isSample?: boolean;
  createdAt: string;
}

export type WardrobeSource = "sample" | "mine";
