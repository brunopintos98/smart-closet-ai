import type { CatalogErrorCode } from "./limits";
import type { CatalogSuggestion } from "./schema";

export type CatalogResponse =
  | { ok: true; suggestion: CatalogSuggestion }
  | { ok: false; code: CatalogErrorCode };

export async function fetchCatalogEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/catalog", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    return ((await response.json()) as { enabled?: boolean }).enabled === true;
  } catch {
    return false;
  }
}

const KNOWN: CatalogErrorCode[] = ["disabled", "badImage", "tooLarge", "dailyLimit", "notGarment", "unavailable"];

export async function requestCatalog(photo: Blob): Promise<CatalogResponse> {
  try {
    const response = await fetch("/api/catalog", {
      method: "POST",
      headers: { "content-type": "image/jpeg" },
      body: photo,
      signal: AbortSignal.timeout(35_000),
    });
    const body = (await response.json()) as { suggestion?: CatalogSuggestion; error?: CatalogErrorCode };
    if (response.ok && body.suggestion) return { ok: true, suggestion: body.suggestion };
    return { ok: false, code: body.error && KNOWN.includes(body.error) ? body.error : "unavailable" };
  } catch {
    return { ok: false, code: "unavailable" };
  }
}
