import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Next's data cache (`fetch` `next.revalidate` and `unstable_cache`) lives in R2 so every isolate
// shares one simulation result and one copy of each settled Sleeper week. The regional Cache API
// layer serves repeat reads in a data center without touching R2; nothing calls `revalidateTag` or
// `revalidatePath`, so entries only ever expire by time and the tag cache can stay disabled.
// Every page is dynamic (cookies, live data), so no ISR page ever needs the queue; the in-isolate
// memory queue is enough and avoids a Durable Object.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived", bypassTagCacheOnCacheHit: true }),
  queue: memoryQueue,
});
