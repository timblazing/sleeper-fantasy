export const REQUEST_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const REQUEST_RATE_LIMIT_MAX_REQUESTS = 20;
export const REQUEST_RATE_LIMIT_MAX_KEYS = 1024;

export type RequestRateLimiter = {
  isAllowed(requestKey: string, now?: number): boolean;
  /** Test hook — drops all recorded request history. */
  reset(): void;
};

/**
 * Each limiter owns its own window, so one endpoint exhausting its budget cannot lock a caller
 * out of the others. Routes with different upstream costs get different allowances.
 *
 * The history lives in process memory: it bounds a single server (or a single Workers isolate),
 * not the whole deployment. A platform rate-limit rule is the account-wide backstop.
 */
export function createRequestRateLimiter(
  maxRequests = REQUEST_RATE_LIMIT_MAX_REQUESTS,
  windowMs = REQUEST_RATE_LIMIT_WINDOW_MS,
  maxKeys = REQUEST_RATE_LIMIT_MAX_KEYS,
): RequestRateLimiter {
  const requestTimestamps = new Map<string, number[]>();

  function removeStaleEntries(now: number) {
    const cutoff = now - windowMs;

    for (const [key, timestamps] of requestTimestamps) {
      const recent = timestamps.filter((timestamp) => timestamp > cutoff);
      if (recent.length === 0) {
        requestTimestamps.delete(key);
      } else if (recent.length !== timestamps.length) {
        requestTimestamps.set(key, recent);
      }
    }
  }

  function removeOldestEntry() {
    let oldestKey: string | undefined;
    let oldestTimestamp = Number.POSITIVE_INFINITY;

    for (const [key, timestamps] of requestTimestamps) {
      const lastRequest = timestamps[timestamps.length - 1];
      if (lastRequest !== undefined && lastRequest < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = lastRequest;
      }
    }

    if (oldestKey !== undefined) {
      requestTimestamps.delete(oldestKey);
    }
  }

  return {
    isAllowed(requestKey: string, now = Date.now()): boolean {
      removeStaleEntries(now);

      const cutoff = now - windowMs;
      const timestamps = requestTimestamps.get(requestKey)?.filter((timestamp) => timestamp > cutoff) ?? [];
      if (timestamps.length >= maxRequests) {
        return false;
      }

      if (!requestTimestamps.has(requestKey) && requestTimestamps.size >= maxKeys) {
        removeOldestEntry();
      }

      timestamps.push(now);
      requestTimestamps.set(requestKey, timestamps);
      return true;
    },
    reset() {
      requestTimestamps.clear();
    },
  };
}

const defaultLimiter = createRequestRateLimiter();
export const isRequestAllowed = (requestKey: string, now = Date.now()) => defaultLimiter.isAllowed(requestKey, now);
export const resetRequestRateLimitForTests = () => defaultLimiter.reset();
