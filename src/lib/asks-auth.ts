import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * One key, set as ASKS_KEY in the Vercel project, opens the ask log. It is
 * pasted once (`/asks?key=...`), kept in a cookie for a year, and never
 * shown again. No key configured means no dashboard at all: the page 404s.
 */

export const COOKIE = "asks";
export const COOKIE_PATH = "/asks";

export function asksKey(): string | null {
  const k = process.env.ASKS_KEY?.trim();
  return k || null;
}

export function keyMatches(given: string | null | undefined): boolean {
  const k = asksKey();
  if (!k || !given) return false;
  const a = Buffer.from(k);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
