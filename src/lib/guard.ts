import { NextRequest } from "next/server";

/**
 * Keeping the chat from becoming somebody else's free API.
 *
 * A public endpoint that proxies a paid model is worth money to a stranger,
 * and the people who find it are not browsing the site. Four cheap layers,
 * in the order they actually stop abuse:
 *
 * 1. ORIGIN. A browser always sends Origin or Referer on a same-site POST.
 *    A script almost never bothers, and if it does it has to lie on purpose.
 *    This alone removes the casual "point my app at his endpoint" case.
 * 2. PER-IP WINDOW. A real reader asks a handful of questions. Anything
 *    hammering the endpoint is not reading.
 * 3. DAILY CEILING for the whole site, so the worst case is a known number
 *    rather than an open tab on his card.
 * 4. SHAPE. Short questions only, few turns, low max_tokens at the call site.
 *
 * State is in memory, which on serverless means per instance and reset on a
 * cold start. That is weaker than Redis and still worth having: it caps a
 * sustained attack from one source, and layer 1 is what stops the common
 * case. If this ever needs to be real, put the counters in Upstash and keep
 * the same shape.
 */

const PER_IP_LIMIT = 12; // questions an hour
const PER_IP_WINDOW_MS = 60 * 60 * 1000;
const PER_IP_DAILY = 40; // questions a day, so twelve an hour cannot become 288
const DAILY_LIMIT = 400; // whole site, all visitors

type Bucket = { hits: number[]; day: number };
const buckets = new Map<string, Bucket>();
let day = new Date().toISOString().slice(0, 10);
let dayCount = 0;

/** Hosts allowed to call the chat. Everything else is somebody else's app. */
function allowedHosts(): string[] {
  const extra = (process.env.CHAT_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return ["skyler-chan.com", "www.skyler-chan.com", "localhost", "127.0.0.1", ...extra];
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type Refusal = { status: number; message: string };

/** Null means let it through. */
export function guard(req: NextRequest): Refusal | null {
  // 1. Same-site only.
  const from = hostOf(req.headers.get("origin")) ?? hostOf(req.headers.get("referer"));
  const hosts = allowedHosts();
  const ok = from ? hosts.some((h) => from === h || from.endsWith(`.${h}`)) : false;
  if (!ok) {
    return { status: 403, message: "This chat only answers from skyler-chan.com. Email him at skylerlchan@gmail.com." };
  }

  // 2. Daily ceiling, reset when the date rolls over.
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
    buckets.clear();
  }
  if (dayCount >= DAILY_LIMIT) {
    return { status: 429, message: "The chat has hit its limit for today. Email him at skylerlchan@gmail.com." };
  }

  // 3. Per-IP sliding window.
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { hits: [], day: 0 };
  bucket.hits = bucket.hits.filter((t) => now - t < PER_IP_WINDOW_MS);
  if (bucket.hits.length >= PER_IP_LIMIT || bucket.day >= PER_IP_DAILY) {
    buckets.set(ip, bucket);
    return { status: 429, message: "That is a lot of questions. Give it an hour, or email him at skylerlchan@gmail.com." };
  }
  bucket.hits.push(now);
  bucket.day += 1;
  buckets.set(ip, bucket);
  dayCount += 1;

  // Keep the map from growing without bound on a long-lived instance.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.hits.some((t) => now - t < PER_IP_WINDOW_MS)) buckets.delete(k);
    }
  }

  return null;
}
