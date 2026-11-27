import { Redis } from "@upstash/redis";

/**
 * Global daily cap for paid AI calls (protection 2), shared by every
 * serverless instance through Upstash Redis. Without Redis it only runs in
 * development (per-process memory); in production it fails closed.
 */
export type QuotaBackend = "redis" | "memory" | "none";

const DAY_SECONDS = 24 * 60 * 60;

function redisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

export function quotaBackend(): QuotaBackend {
  if (redisConfigured()) return "redis";
  return process.env.NODE_ENV === "production" ? "none" : "memory";
}

/** UTC day bucket, e.g. "catalog:2026-11-27". */
export function quotaKey(now: Date): string {
  return `catalog:${now.toISOString().slice(0, 10)}`;
}

const memory = new Map<string, number>();
let redis: Redis | null = null;

export class QuotaUnavailableError extends Error {}

/**
 * Reserves one call for today. The slot is taken before the paid call, so a
 * burst of parallel requests can never exceed the limit.
 */
export async function reserveDailySlot(
  limit: number,
  now = new Date(),
): Promise<{ allowed: boolean; used: number }> {
  const key = quotaKey(now);
  const backend = quotaBackend();

  if (backend === "memory") {
    const used = (memory.get(key) ?? 0) + 1;
    memory.set(key, used);
    return { allowed: used <= limit, used };
  }
  if (backend === "none") throw new QuotaUnavailableError("No quota store configured");

  try {
    redis ??= Redis.fromEnv();
    const used = await redis.incr(key);
    if (used === 1) await redis.expire(key, 2 * DAY_SECONDS);
    return { allowed: used <= limit, used };
  } catch {
    throw new QuotaUnavailableError("Quota store unreachable");
  }
}

export function dailyLimit(): number {
  const raw = Number(process.env.CATALOG_DAILY_LIMIT);
  return Number.isInteger(raw) && raw > 0 ? raw : 300;
}
