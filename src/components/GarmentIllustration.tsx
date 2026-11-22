import type { ColorId, GarmentCategory, GarmentKind } from "@/types/wardrobe";
import { COLORS } from "@/lib/recommendation/colors";

/**
 * Flat SVG drawings per garment type, tinted with the garment color.
 * Original artwork: no third-party photos or brands.
 */
const DEFAULT_KIND: Record<GarmentCategory, GarmentKind> = {
  top: "tshirt",
  bottom: "pants",
  outerwear: "jacket",
  footwear: "sneakers",
  onePiece: "dress",
};

export const KINDS_BY_CATEGORY: Record<GarmentCategory, GarmentKind[]> = {
  top: ["tshirt", "shirt", "sweater"],
  bottom: ["pants", "jeans", "skirt", "shorts"],
  outerwear: ["jacket", "blazer", "coat", "raincoat"],
  footwear: ["sneakers", "boots", "loafers", "heels"],
  onePiece: ["dress"],
};

const BODY: Record<GarmentKind, string> = {
  tshirt: "M32 18 L43 14 Q50 22 57 14 L68 18 L86 32 L77 43 L69 38 L69 86 L31 86 L31 38 L23 43 L14 32 Z",
  shirt: "M33 16 L44 12 L50 20 L56 12 L67 16 L81 27 L87 72 L78 74 L71 41 L71 88 L29 88 L29 41 L22 74 L13 72 L19 27 Z",
  sweater: "M34 16 L43 13 Q50 19 57 13 L66 16 L81 27 L87 74 L78 76 L71 42 L71 86 L29 86 L29 42 L22 76 L13 74 L19 27 Z",
  blazer: "M33 14 L44 11 L50 30 L56 11 L67 14 L81 26 L87 74 L78 76 L71 42 L71 88 L29 88 L29 42 L22 76 L13 74 L19 26 Z",
  coat: "M34 10 L44 8 L50 26 L56 8 L66 10 L80 22 L86 70 L77 72 L72 40 L74 94 L26 94 L28 40 L23 72 L14 70 L20 22 Z",
  jacket: "M33 16 L44 12 Q50 17 56 12 L67 16 L81 27 L87 70 L78 72 L71 42 L71 80 L29 80 L29 42 L22 72 L13 70 L19 27 Z",
  raincoat: "M36 18 Q38 6 50 6 Q62 6 64 18 L80 26 L86 72 L77 74 L72 42 L73 90 L27 90 L28 42 L23 74 L14 72 L20 26 Z",
  pants: "M30 10 L70 10 L74 90 L56 90 L50 36 L44 90 L26 90 Z",
  jeans: "M30 10 L70 10 L74 90 L56 90 L50 36 L44 90 L26 90 Z",
  shorts: "M28 22 L72 22 L77 64 L54 66 L50 44 L46 66 L23 64 Z",
  skirt: "M34 18 L66 18 L80 84 L20 84 Z",
  dress: "M40 10 L45 10 Q50 17 55 10 L60 10 L62 30 L57 40 L80 90 L20 90 L43 40 L38 30 Z",
  sneakers: "M10 62 Q12 46 26 44 L40 40 Q50 52 66 54 L84 58 Q92 60 92 68 L92 72 L10 72 Z",
  boots: "M30 14 L52 14 L54 56 L80 62 Q90 64 90 74 L90 78 L30 78 Z",
  loafers: "M10 64 Q14 52 30 52 L60 54 Q86 56 90 66 L90 72 L10 72 Z",
  heels: "M12 64 Q28 50 48 56 L80 48 Q88 48 88 56 L86 60 L70 62 L67 84 L63 84 L61 64 L20 68 Z",
};

/** Seams, collars, soles: drawn on top in a darker tone. */
function Details({ kind }: { kind: GarmentKind }) {
  const s = { fill: "none", stroke: "rgba(0,0,0,.28)", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "shirt":
      return (
        <g {...s}>
          <path d="M44 12 L42 22 L50 20 L58 22 L56 12" />
          <path d="M50 20 L50 88" />
          {[32, 46, 60, 74].map((y) => <circle key={y} cx="52.5" cy={y} r="0.9" fill="rgba(0,0,0,.35)" stroke="none" />)}
        </g>
      );
    case "sweater":
      return <g {...s}><path d="M29 80 L71 80 M78 70 L87 68 M22 70 L13 68" /><path d="M43 13 Q50 21 57 13" /></g>;
    case "blazer":
      return (
        <g {...s}>
          <path d="M44 11 L40 30 L50 52 L60 30 L56 11" />
          <path d="M50 52 L50 88" />
          <circle cx="53" cy="60" r="1.2" fill="rgba(0,0,0,.35)" stroke="none" />
          <path d="M35 66 L44 66 M56 66 L65 66" />
        </g>
      );
    case "coat":
      return <g {...s}><path d="M44 8 L40 26 L50 44 L60 26 L56 8" /><path d="M50 44 L50 94" /><path d="M28 56 L72 56" /></g>;
    case "jacket":
      return <g {...s}><path d="M50 15 L50 80" /><path d="M29 74 L71 74" /><path d="M36 50 L44 50 M56 50 L64 50" /></g>;
    case "raincoat":
      return <g {...s}><path d="M40 20 Q50 30 60 20" /><path d="M50 26 L50 90" /><path d="M35 60 L44 60 M56 60 L65 60" /></g>;
    case "pants":
      return <g {...s}><path d="M30 18 L70 18" /><path d="M50 18 L50 34" /></g>;
    case "jeans":
      return <g {...s}><path d="M30 18 L70 18" /><path d="M50 18 L50 34" /><path d="M33 18 Q36 28 44 26 M67 18 Q64 28 56 26" /></g>;
    case "shorts":
      return <g {...s}><path d="M28 30 L72 30" /></g>;
    case "skirt":
      return <g {...s}><path d="M33 26 L67 26" /><path d="M42 26 L36 84 M58 26 L64 84" /></g>;
    case "dress":
      return <g {...s}><path d="M38 30 Q50 36 62 30" /></g>;
    case "sneakers":
      return <g {...s}><path d="M10 66 L92 66" /><path d="M34 46 L40 56 M40 44 L46 54 M46 46 L52 54" /></g>;
    case "boots":
      return <g {...s}><path d="M30 70 L90 70" /><path d="M30 22 L52 22" /></g>;
    case "loafers":
      return <g {...s}><path d="M10 67 L90 67" /><path d="M36 56 Q48 62 60 56" /></g>;
    case "heels":
      return <g {...s}><path d="M30 60 Q44 56 56 58" /></g>;
    default:
      return <g {...s}><path d="M43 14 Q50 22 57 14" /></g>;
  }
}

export function GarmentIllustration({
  kind,
  category,
  color,
  className,
}: {
  kind?: GarmentKind;
  category: GarmentCategory;
  color: ColorId;
  className?: string;
}) {
  const k = kind ?? DEFAULT_KIND[category];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden="true">
      <path
        d={BODY[k]}
        fill={COLORS[color].hex}
        stroke="rgba(0,0,0,.32)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <Details kind={k} />
    </svg>
  );
}
