import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyLimit, quotaBackend, quotaKey, QuotaUnavailableError, reserveDailySlot } from "./dailyQuota";

afterEach(() => vi.unstubAllEnvs());

describe("daily quota", () => {
  it("buckets by UTC day", () => {
    expect(quotaKey(new Date("2026-11-27T23:59:00-03:00"))).toBe("catalog:2026-11-28");
  });

  it("blocks once the limit is reached (memory backend in dev/test)", async () => {
    const day = new Date("2030-01-01T10:00:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await reserveDailySlot(3, day)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("starts a new count the next day", async () => {
    await reserveDailySlot(1, new Date("2030-02-01T10:00:00Z"));
    expect((await reserveDailySlot(1, new Date("2030-02-02T10:00:00Z"))).allowed).toBe(true);
  });

  it("fails closed in production without Redis", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    expect(quotaBackend()).toBe("none");
    await expect(reserveDailySlot(10)).rejects.toBeInstanceOf(QuotaUnavailableError);
  });

  it("uses Redis when either variable pair is set", () => {
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "token");
    expect(quotaBackend()).toBe("redis");
  });

  it("reads the limit from the environment with a safe default", () => {
    expect(dailyLimit()).toBe(300);
    vi.stubEnv("CATALOG_DAILY_LIMIT", "50");
    expect(dailyLimit()).toBe(50);
    vi.stubEnv("CATALOG_DAILY_LIMIT", "abc");
    expect(dailyLimit()).toBe(300);
  });
});
