import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Backs `fetch(..., { next: { revalidate } })` in fetchCached so Sleeper/ESPN/RosterAudit responses
// are shared across Worker isolates instead of refetched on every request.
export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
