/** Request bounds for AI cataloging (protection 4). Shared by client and server. */
export const CATALOG_MAX_BYTES = 600 * 1024;
/** The client resizes to 1024 px; a little slack for rounding. */
export const CATALOG_MAX_DIMENSION = 1100;
export const CATALOG_DEFAULT_DAILY_LIMIT = 300;

export type CatalogErrorCode =
  | "disabled"
  | "badImage"
  | "tooLarge"
  | "dailyLimit"
  | "notGarment"
  | "unavailable";

export function validateCatalogImage(
  bytes: Uint8Array,
  readSize: (b: Uint8Array) => { width: number; height: number } | null,
): CatalogErrorCode | null {
  if (bytes.length === 0) return "badImage";
  if (bytes.length > CATALOG_MAX_BYTES) return "tooLarge";
  const size = readSize(bytes);
  if (!size) return "badImage";
  if (size.width > CATALOG_MAX_DIMENSION || size.height > CATALOG_MAX_DIMENSION) return "tooLarge";
  return null;
}
