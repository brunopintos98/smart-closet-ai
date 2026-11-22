import type { Garment } from "@/types/wardrobe";

const CREATED = "2026-01-01T00:00:00.000Z";

type SampleInput = Omit<Garment, "isSample" | "createdAt">;

const items: SampleInput[] = [
  { id: "s-tee-white", name: "Remera blanca", category: "top", kind: "tshirt", color: "white", warmth: "light", formality: 1, occasions: ["casual", "sport"], rainFriendly: true },
  { id: "s-shirt-lightblue", name: "Camisa celeste", category: "top", kind: "shirt", color: "lightBlue", warmth: "light", formality: 4, occasions: ["office", "dinner", "formal"], rainFriendly: true },
  { id: "s-sweater-gray", name: "Sweater de lana gris", category: "top", kind: "sweater", color: "gray", warmth: "warm", formality: 3, occasions: ["office", "casual", "dinner"], rainFriendly: true },
  { id: "s-jeans", name: "Jean azul", category: "bottom", kind: "jeans", color: "denim", warmth: "medium", formality: 2, occasions: ["casual", "dinner"], rainFriendly: true },
  { id: "s-trousers-black", name: "Pantalón sastrero negro", category: "bottom", kind: "pants", color: "black", warmth: "medium", formality: 4, occasions: ["office", "dinner", "formal"], rainFriendly: true },
  { id: "s-shorts-sport", name: "Short deportivo", category: "bottom", kind: "shorts", color: "black", warmth: "light", formality: 1, occasions: ["sport"], rainFriendly: true },
  { id: "s-dress-black", name: "Vestido negro midi", category: "onePiece", kind: "dress", color: "black", warmth: "light", formality: 4, occasions: ["dinner", "formal"], rainFriendly: true },
  { id: "s-blazer-navy", name: "Blazer azul marino", category: "outerwear", kind: "blazer", color: "navy", warmth: "medium", formality: 4, occasions: ["office", "dinner", "formal"], rainFriendly: false },
  { id: "s-raincoat-olive", name: "Campera impermeable", category: "outerwear", kind: "raincoat", color: "olive", warmth: "medium", formality: 2, occasions: ["casual", "sport", "office"], rainFriendly: true },
  { id: "s-coat-camel", name: "Tapado camel", category: "outerwear", kind: "coat", color: "camel", warmth: "warm", formality: 4, occasions: ["office", "dinner", "formal"], rainFriendly: false },
  { id: "s-sneakers-white", name: "Zapatillas blancas", category: "footwear", kind: "sneakers", color: "white", warmth: "medium", formality: 2, occasions: ["casual", "sport"], rainFriendly: true },
  { id: "s-loafers-suede", name: "Mocasines de gamuza", category: "footwear", kind: "loafers", color: "brown", warmth: "medium", formality: 4, occasions: ["office", "dinner", "formal"], rainFriendly: false },
  { id: "s-boots-black", name: "Botas de cuero negras", category: "footwear", kind: "boots", color: "black", warmth: "warm", formality: 4, occasions: ["office", "casual", "dinner", "formal"], rainFriendly: true },
];

export const SAMPLE_WARDROBE: Garment[] = items.map((g) => ({
  ...g,
  isSample: true,
  createdAt: CREATED,
}));
