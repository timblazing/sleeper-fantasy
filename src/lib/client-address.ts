import { z } from "zod";

/** Parsed with zod rather than `node:net` so this runs unchanged on runtimes without Node's net module. */
const ipAddress = z.union([z.ipv4(), z.ipv6()]);
const isIpAddress = (value: string | undefined): value is string => value !== undefined && ipAddress.safeParse(value).success;

/**
 * Best-effort client identity for rate limiting. Proxy headers are spoofable, so this bounds
 * casual abuse rather than a determined attacker; `anonymous` groups every unidentifiable caller
 * into one shared bucket, which fails closed.
 */
export function getClientAddress(headers: Headers): string {
  // Set by Cloudflare's edge and not client-spoofable, unlike the forwarded headers below.
  const cloudflareAddress = headers.get("cf-connecting-ip")?.trim();
  if (isIpAddress(cloudflareAddress)) return cloudflareAddress;

  const forwardedAddress = headers.get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .find(isIpAddress);
  if (forwardedAddress) return forwardedAddress;

  const realAddress = headers.get("x-real-ip")?.trim();
  if (isIpAddress(realAddress)) return realAddress;

  return "anonymous";
}

/** The shared 429 body. `retry-after` matches the limiter's ten-minute window. */
export function rateLimited(message: string) {
  return Response.json({ error: message }, { status: 429, headers: { "retry-after": "600" } });
}
