"use client";

import * as React from "react";
import { formatKickoff } from "@/lib/display";

// The device zone never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * Kickoff rendered in the reader's device zone.
 *
 * The server cannot know that zone, so `useSyncExternalStore` gives it ESPN's own Eastern label for
 * the server pass and the hydration pass, then the local time — keeping the first client render
 * byte-identical to the HTML. Formatting directly in render would mismatch for every reader
 * outside Eastern.
 */
export function KickoffTime({ kickoff, fallback }: { kickoff: string; fallback: string }) {
  const label = React.useSyncExternalStore(
    subscribe,
    () => formatKickoff(kickoff) || fallback,
    () => fallback,
  );
  return <>{label}</>;
}
