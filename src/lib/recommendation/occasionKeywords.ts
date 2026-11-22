import type { Occasion } from "@/types/wardrobe";

/**
 * V1 "chat": keyword matching only, no language model. Checked in order, so
 * more specific occasions (formal events) win over generic ones.
 */
const KEYWORDS: ReadonlyArray<readonly [Occasion, readonly string[]]> = [
  [
    "formal",
    ["casamiento", "boda", "gala", "graduacion", "egreso", "evento formal", "ceremonia", "fiesta formal", "cocktail", "coctel"],
  ],
  [
    "sport",
    ["gym", "gimnasio", "entrenar", "entreno", "correr", "running", "deporte", "yoga", "pilates", "futbol", "padel", "tenis", "crossfit", "bici"],
  ],
  [
    "office",
    ["oficina", "trabajo", "laburo", "reunion", "cliente", "entrevista", "presentacion", "facultad de negocios", "clase en la facu"],
  ],
  [
    "dinner",
    ["cena", "cenar", "restaurante", "restaurant", "cita", "salida", "bar", "tragos", "after"],
  ],
  [
    "casual",
    ["casual", "paseo", "pasear", "amigos", "cafe", "facu", "facultad", "universidad", "shopping", "plaza", "mate", "finde", "almuerzo", "feria"],
  ],
];

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface OccasionMatch {
  occasion: Occasion;
  keyword: string;
}

export function detectOccasion(text: string): OccasionMatch | null {
  const normalized = ` ${normalizeText(text)} `;
  if (normalized.trim() === "") return null;
  for (const [occasion, words] of KEYWORDS) {
    for (const keyword of words) {
      if (normalized.includes(` ${keyword} `)) return { occasion, keyword };
    }
  }
  return null;
}
