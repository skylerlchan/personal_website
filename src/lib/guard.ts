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
const STRIKES_TO_BLOCK = 3; // abusive messages before an address is shut out
const BLOCK_MS = 24 * 60 * 60 * 1000; // for a day

type Bucket = { hits: number[]; day: number; strikes: number; blockedUntil: number };
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
  // 0. The switches he can flip from the Vercel dashboard without a deploy:
  //    CHAT_DISABLED=1 turns the chat off; CHAT_BLOCKED_IPS is a comma list.
  if (/^(1|true|yes)$/i.test(process.env.CHAT_DISABLED?.trim() ?? "")) {
    return { status: 503, message: "The chat is switched off right now. Email him at skylerlchan@gmail.com." };
  }
  const ipNow = clientIp(req);
  const blockedList = (process.env.CHAT_BLOCKED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (blockedList.includes(ipNow)) {
    return { status: 403, message: "This address is blocked from the chat. Email him at skylerlchan@gmail.com." };
  }

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
  const bucket = buckets.get(ip) ?? { hits: [], day: 0, strikes: 0, blockedUntil: 0 };
  if (bucket.blockedUntil > now) {
    return { status: 403, message: "This address is blocked from the chat for now. Email him at skylerlchan@gmail.com." };
  }
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

/**
 * Abuse, cheaply and before the model. Two kinds count: trying to steer the
 * model off its job (injection), and hostility. Three in a day and the
 * address is shut out for a day. The list is short on purpose: it exists to
 * stop someone hammering the box, not to police tone, and the model's own
 * rules handle the subtle cases.
 */
const ABUSE = [
  /ignore (all |any |the |your )?(previous|prior|above|earlier|system) (instructions|prompts?|rules)/i,
  /(reveal|print|show|repeat|leak|dump) (me )?(your|the) (system )?(prompt|instructions|rules)/i,
  /\b(jailbreak|DAN mode|developer mode|do anything now)\b/i,
  /you are now (a|an|the) /i,
  /\b(pretend|act) (to be|as) (a|an|my)\b.*\b(without|no) (rules|restrictions|limits)/i,
  /\b(kill|hurt|rape|shoot) (yourself|himself|him)\b/i,
  /\b(fuck|f\*ck) (you|him|off)\b/i,
  // Slurs and insults aimed at him. The model would decline these anyway,
  // but Google's filter sometimes answers with nothing at all, and nothing
  // is worse than a refusal.
  /\b(retard(ed)?|autis(t|tic)|spastic|cretin|moron(ic)?)\b/i,
  /\bis he (stupid|dumb|an idiot|a loser|a fraud|a scam(mer)?|ugly|fat|gay)\b/i,
];

export function abusive(text: string): boolean {
  return ABUSE.some((re) => re.test(text));
}

/** Record one abusive message from this address; true once it is blocked. */
export function strike(req: NextRequest): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { hits: [], day: 0, strikes: 0, blockedUntil: 0 };
  bucket.strikes += 1;
  if (bucket.strikes >= STRIKES_TO_BLOCK) bucket.blockedUntil = now + BLOCK_MS;
  buckets.set(ip, bucket);
  return bucket.blockedUntil > now;
}

/** A short, stable tag for an address, for the Telegram line and the block list. */
export function ipTag(req: NextRequest): string {
  return clientIp(req);
}
