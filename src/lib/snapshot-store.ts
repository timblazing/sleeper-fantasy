import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The slice of an R2 bucket binding the snapshot readers use. Declared structurally rather than
 * from `@cloudflare/workers-types` because the same code also runs under Node (`next dev`, tests),
 * where those globals would clash with the DOM and Node `fetch` types.
 */
export type SnapshotBucket = {
  get(key: string): Promise<{ json<T>(): Promise<T> } | null>;
};

/**
 * The `SNAPSHOTS` R2 binding when running as a Cloudflare Worker, or null under Node (`next dev`,
 * `next start` and tests), where readers fall back to fetching Sleeper directly as they always have.
 */
export function getSnapshotBucket(): SnapshotBucket | null {
  try {
    const env = getCloudflareContext().env as { SNAPSHOTS?: SnapshotBucket };
    return env.SNAPSHOTS ?? null;
  } catch {
    return null;
  }
}

/** Null when the object does not exist; throws when R2 or the JSON body fails. */
export async function readSnapshot<T>(bucket: SnapshotBucket, key: string): Promise<T | null> {
  const object = await bucket.get(key);
  return object ? object.json<T>() : null;
}
