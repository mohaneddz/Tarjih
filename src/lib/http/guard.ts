/**
 * Request guards shared by the routes that spend money on the language model.
 *
 * The limiter is per server instance and in memory: on serverless hosting each
 * instance counts on its own, so it is a brake on one visitor hammering the
 * button, not an exact quota. That is the failure it exists for — a public
 * demo link running up the provider bill — and it needs no extra service.
 */

import type { NextRequest } from "next/server";

/** Longer than any real question; short enough to keep prompts cheap. */
export const MAX_QUESTION_LENGTH = 500;

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 40; // a question is two calls; a room on one Wi-Fi shares an IP
const MAX_TRACKED_CLIENTS = 5_000;

const hits = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/**
 * Records a request and reports whether it is over the limit. Returns the
 * number of seconds to wait when it is, or 0 when the request may proceed.
 */
export function rateLimit(req: NextRequest, now = Date.now()): number {
  const key = clientKey(req);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, recent);
    return Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > MAX_TRACKED_CLIENTS) {
    // Drop the oldest-inserted clients rather than growing without bound.
    for (const k of [...hits.keys()].slice(0, hits.size - MAX_TRACKED_CLIENTS)) hits.delete(k);
  }
  return 0;
}
