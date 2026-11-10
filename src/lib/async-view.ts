/**
 * Client-side async state, made explicit.
 *
 * A component stores only the last *answer* it received, tagged with the input (`key`) it
 * answers. Whether it is idle, pending, done or failed is derived on every render by comparing
 * that tag with the current input, so there are no loading/error booleans to keep in sync, no
 * reset calls on every edit, and a stale answer can never be shown for a newer input.
 *
 *   idle ──input──▶ pending ──answer(key)──▶ done | failed
 *     ▲                ▲                          │
 *     └── no input ────┴──── input changes ───────┘
 */

export type Answer<T> = { key: string; ok: true; value: T } | { key: string; ok: false; error: string };

export type AsyncView<T> =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; value: T }
  | { status: "failed"; error: string };

/** `key` is the current input, or `null` when there is nothing to ask for yet. */
export function viewOf<T>(key: string | null, answer: Answer<T> | null): AsyncView<T> {
  if (key === null) return { status: "idle" };
  if (answer?.key !== key) return { status: "pending" };
  return answer.ok ? { status: "done", value: answer.value } : { status: "failed", error: answer.error };
}

/** Read a JSON body without letting a non-JSON error page (a proxy 502) surface a parser message. */
export async function readJson<T extends object>(response: Response): Promise<Partial<T>> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" ? (body as Partial<T>) : {};
  } catch {
    return {};
  }
}
