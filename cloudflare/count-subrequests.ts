import { AsyncLocalStorage } from "node:async_hooks";

/** Outbound `fetch` calls made while serving one request, by host. Cache hits never reach here. */
export type SubrequestTally = { total: number; hosts: Record<string, number> };

export const tally = new AsyncLocalStorage<SubrequestTally>();

// Installed before the OpenNext handler loads (see worker.ts), so Next's patched fetch wraps this
// one and only real network reads are counted. Workers Free allows 50 per request.
const networkFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const store = tally.getStore();
  if (store) {
    const url = input instanceof Request ? input.url : String(input);
    const host = URL.canParse(url) ? new URL(url).host : "other";
    store.total++;
    store.hosts[host] = (store.hosts[host] ?? 0) + 1;
  }
  return networkFetch(input, init);
};
