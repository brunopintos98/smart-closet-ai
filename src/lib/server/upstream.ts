/**
 * Small helpers shared by the route handlers that proxy Open-Meteo:
 * a hard timeout and a per-instance in-memory cache. On Vercel the CDN also
 * caches successful responses through the Cache-Control header.
 */
export const UPSTREAM_TIMEOUT_MS = 4000;

export type UpstreamErrorCode = "timeout" | "rateLimited" | "upstream" | "badRequest";

export class UpstreamError extends Error {
  constructor(public code: UpstreamErrorCode, message?: string) {
    super(message ?? code);
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new UpstreamError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "upstream");
  }
  if (response.status === 429) throw new UpstreamError("rateLimited");
  if (!response.ok) throw new UpstreamError("upstream", `HTTP ${response.status}`);
  return (await response.json()) as T;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export function createMemoryCache<T>(ttlMs: number, maxEntries = 200) {
  const store = new Map<string, Entry<T>>();
  return {
    get(key: string): T | undefined {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expiresAt < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key: string, value: T) {
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}

export function errorResponse(code: UpstreamErrorCode): Response {
  const status = code === "badRequest" ? 400 : code === "timeout" ? 504 : code === "rateLimited" ? 503 : 502;
  return Response.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
}
