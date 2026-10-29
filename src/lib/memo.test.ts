import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemo } from "@/lib/memo";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createMemo", () => {
  it("serves a cached value inside the TTL without reloading", async () => {
    const load = vi.fn(async (key: string) => `v:${key}`);
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    await expect(memo.get("a")).resolves.toBe("v:a");
    await expect(memo.get("a")).resolves.toBe("v:a");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reloads once the TTL has elapsed", async () => {
    const load = vi.fn(async (key: string) => `v:${key}`);
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    await memo.get("a");
    vi.advanceTimersByTime(1001);
    await memo.get("a");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("shares one load between concurrent gets for the same key", async () => {
    const load = vi.fn(async (key: string) => `v:${key}`);
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    const [first, second] = await Promise.all([memo.get("a"), memo.get("a")]);
    expect(first).toBe("v:a");
    expect(second).toBe("v:a");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not let one key's load block another's", async () => {
    const load = vi.fn(async (key: string) => `v:${key}`);
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    const [a, b] = await Promise.all([memo.get("a"), memo.get("b")]);
    expect([a, b]).toEqual(["v:a", "v:b"]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("serves a stale value when the reload fails, and recovers afterwards", async () => {
    const load = vi.fn<(key: string) => Promise<string>>().mockResolvedValueOnce("fresh").mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("newer");
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    await expect(memo.get("a")).resolves.toBe("fresh");
    vi.advanceTimersByTime(1001);
    await expect(memo.get("a")).resolves.toBe("fresh");
    vi.advanceTimersByTime(1001);
    await expect(memo.get("a")).resolves.toBe("newer");
  });

  it("rethrows a failure with no cached value under onError: throw", async () => {
    const memo = createMemo({ load: async () => { throw new Error("down"); }, ttlMs: 1000, onError: "throw" as const });
    await expect(memo.get("a")).rejects.toThrow("down");
  });

  it("returns the fallback for a failure with no cached value when a factory is given", async () => {
    const memo = createMemo({ load: async (): Promise<string[]> => { throw new Error("down"); }, ttlMs: 1000, onError: () => [] });
    await expect(memo.get("a")).resolves.toEqual([]);
  });

  it("clears only the failing key's inflight entry", async () => {
    const load = vi.fn(async (key: string) => { if (key === "bad") throw new Error("down"); return `v:${key}`; });
    const memo = createMemo({ load, ttlMs: 1000, onError: () => "fallback" });
    const [bad, good] = await Promise.all([memo.get("bad"), memo.get("good")]);
    expect(bad).toBe("fallback");
    expect(good).toBe("v:good");
    // The failed key retries on the next get rather than being pinned to a dead promise.
    await expect(memo.get("bad")).resolves.toBe("fallback");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("drops cache and inflight state on reset", async () => {
    const load = vi.fn(async (key: string) => `v:${key}`);
    const memo = createMemo({ load, ttlMs: 1000, onError: "throw" });
    await memo.get("a");
    memo.reset();
    await memo.get("a");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("chooses the TTL from the loaded value", async () => {
    const load = vi.fn(async (key: string) => key);
    const memo = createMemo({ load, ttlMs: (value: string) => (value === "final" ? 10_000 : 1000), onError: "throw" });
    await memo.get("final");
    await memo.get("live");
    vi.advanceTimersByTime(1001);
    await memo.get("final");
    await memo.get("live");
    expect(load.mock.calls.map(([key]) => key)).toEqual(["final", "live", "live"]);
  });

  it("evicts the oldest-written key once maxKeys is reached", async () => {
    const load = vi.fn(async (key: string) => key);
    const memo = createMemo({ load, ttlMs: 10_000, maxKeys: 2, onError: "throw" });
    await memo.get("a");
    await memo.get("b");
    await memo.get("c");
    await memo.get("b");
    await memo.get("a");
    expect(load.mock.calls.map(([key]) => key)).toEqual(["a", "b", "c", "a"]);
  });
});
