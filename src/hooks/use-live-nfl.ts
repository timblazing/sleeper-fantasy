"use client";

import { useCallback, useEffect, useState } from "react";

/** Poll only the visible page, abort on close/navigation, and retain last good data on errors. */
export function useLiveNfl<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  useEffect(() => {
    let disposed = false;
    let pending = false;
    const controller = new AbortController();
    async function load() {
      if (pending || document.hidden) return;
      pending = true;
      setRefreshing(true);
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
        }
      } catch (cause) {
        if (!disposed)
          setError(
            cause instanceof Error ? cause.message : "Unable to load scores.",
          );
      } finally {
        pending = false;
        if (!disposed) setRefreshing(false);
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, revision]);

  return { data, error, refreshing, refresh };
}
