/**
 * A tiny in-process memo: TTL, single-flight dedupe, and serve-stale-on-error.
 *
 * This exists for payloads too large for Next's data cache (the ~15MB Sleeper player map, the
 * weekly projection feed), and for live ESPN reads that many concurrent viewers would otherwise
 * each repeat. Callers whose key space is not inherently small pass `maxKeys`, which evicts the
 * oldest-written entry first.
 */
export type MemoOptions<K extends string, V> = {
  load: (key: K) => Promise<V>;
  /** A fixed TTL, or one chosen per value — a finished game can be kept far longer than a live one. */
  ttlMs: number | ((value: V) => number);
  maxKeys?: number;
  /** "throw" rethrows when there is no usable cached value; otherwise this factory supplies a fallback. */
  onError: "throw" | (() => V);
};

export type Memo<K extends string, V> = {
  get(key: K): Promise<V>;
  /** Test hook — drops cache and inflight state. */
  reset(): void;
};

export function createMemo<K extends string, V>(options: MemoOptions<K, V>): Memo<K, V> {
  const cache = new Map<K, { expires: number; value: V }>();
  const ttlFor = (value: V) => (typeof options.ttlMs === "function" ? options.ttlMs(value) : options.ttlMs);
  const store = (key: K, value: V) => {
    // Re-inserting moves the key to the end, so Map order is write order and the first key is oldest.
    cache.delete(key);
    if (options.maxKeys !== undefined && cache.size >= options.maxKeys) {
      const oldest = cache.keys().next();
      if (!oldest.done) cache.delete(oldest.value);
    }
    cache.set(key, { expires: Date.now() + ttlFor(value), value });
  };
  const inflight = new Map<K, Promise<V>>();

  return {
    async get(key: K): Promise<V> {
      const cached = cache.get(key);
      if (cached && Date.now() < cached.expires) return cached.value;

      let promise = inflight.get(key);
      if (!promise) {
        promise = options
          .load(key)
          .then((value) => { store(key, value); return value; })
          // Guarded by identity so a slow loser cannot clear a newer inflight entry for the same key.
          .finally(() => { if (inflight.get(key) === promise) inflight.delete(key); });
        inflight.set(key, promise);
      }

      try {
        return await promise;
      } catch (error) {
        // A stale value beats nothing when the upstream is briefly unavailable.
        const stale = cache.get(key);
        if (stale) return stale.value;
        if (options.onError === "throw") throw error;
        return options.onError();
      }
    },
    reset() {
      cache.clear();
      inflight.clear();
    },
  };
}
