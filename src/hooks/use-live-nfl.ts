"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_REFRESH_MS = 30_000;

/**
 * Poll only the visible page, abort on close/navigation, and retain last good data on errors.
 *
 * `nextRefreshMs` picks the delay after each successful load from what came back, so a slate with
 * nothing live slows down and a finished game stops polling entirely (return `null`). Errors and
 * the first load before any data keep the default cadence.
 */
export function useLiveNfl<T>(url: string, nextRefreshMs?: (data: T) => number | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  // Read through a ref so an inline policy function does not restart the poll on every render.
  const policy = useRef(nextRefreshMs);
  useEffect(() => { policy.current = nextRefreshMs; });

  useEffect(() => {
    let disposed = false;
    let pending = false;
    let stopped = false;
    let timer: number | undefined;
    const controller = new AbortController();
    const schedule = (delay: number | null) => {
      window.clearTimeout(timer);
      if (disposed) return;
      if (delay === null) { stopped = true; return; }
      timer = window.setTimeout(() => void load(), delay);
    };
    async function load() {
      if (pending || stopped) return;
      // A hidden tab stops here; the visibility listener restarts the loop when it is shown.
      if (document.hidden) return;
      pending = true;
      setRefreshing(true);
      let delay: number | null = DEFAULT_REFRESH_MS;
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("Unable to update from ESPN. Try again shortly.");
        const value = (await response.json()) as T;
        if (!disposed) {
          setData(value);
          setError(null);
          delay = policy.current ? policy.current(value) : DEFAULT_REFRESH_MS;
        }
      } catch (cause) {
        if (!disposed)
          setError(
            cause instanceof Error ? cause.message : "Unable to load scores.",
          );
      } finally {
        pending = false;
        if (!disposed) setRefreshing(false);
        schedule(delay);
      }
    }
    void load();
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, revision]);

  return { data, error, refreshing, refresh };
}
