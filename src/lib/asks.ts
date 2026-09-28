import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import type { NextRequest } from "next/server";

/**
 * The log of what people ask the chat, and what it said back.
 *
 * One small JSON file per turn, in the private Blob store the corpus already
 * lives in, at asks/<session>/<turn>-<time>[-<flag>].json. The pathname
 * carries the day, the time, the turn number and whether the turn was
 * refused, so one list() gives every count the dashboard shows without
 * reading a single file. Files are only ever added, never read back before
 * a write, so two instances answering at once cannot race each other.
 *
 * Without Blob credentials, which is local dev, the same tree is written
 * under ./asks, which is gitignored, and the dashboard reads it from there.
 *
 * The budget on Hobby is 2,000 advanced operations a month, and every put()
 * and list() is one. That is roughly 1,500 questions a month with room left
 * for the dashboard, which lists at most once a minute. Past it the store
 * pauses, the put fails quietly, and the chat carries on unlogged.
 */

export type Flag = "abuse" | "blocked" | "empty" | "failed" | "stopped";

export type Ask = {
  /** ISO time the question arrived. */
  at: string;
  /** yyyymmdd-hhmmss-xxxx, UTC, minted by the server on the first turn. */
  session: string;
  /** 1-based count of the visitor's turns in this conversation. */
  turn: number;
  q: string;
  a: string;
  /** Which model answered, or "local" for the no-model path. */
  model: string;
  /** Question in to answer out, in milliseconds. */
  ms: number;
  /** "City, CC" from Vercel's geo headers, when present. */
  where?: string;
  ua?: string;
  /** Eight hex chars of the address, enough to see the same visitor return. */
  ipHash: string;
  /** The real address, kept only on flagged turns so he can block it. */
  ip?: string;
  flag?: Flag;
};

export type TurnRef = { path: string; session: string; turn: number; at: Date; flag?: Flag };
export type SessionRef = { id: string; at: Date; turns: TurnRef[] };

const PREFIX = "asks/";
const LOCAL_DIR = path.join(process.cwd(), "asks");
const SESSION_RE = /^\d{8}-\d{6}-[a-z0-9]{4}$/;
const FILE_RE = /^(\d{2})-(\d{6})(?:-([a-z]+))?\.json$/;

const hasBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function stamp(d: Date): { day: string; time: string } {
  return {
    day: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`,
  };
}

/** A new session id, or the client's if it is well formed. */
export function sessionFor(candidate: unknown, now = new Date()): string {
  if (typeof candidate === "string" && SESSION_RE.test(candidate)) return candidate;
  const { day, time } = stamp(now);
  return `${day}-${time}-${randomBytes(3).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x").slice(0, 4)}`;
}

/** "City, CC" from the headers Vercel adds, or nothing locally. */
export function whereOf(req: NextRequest): string | undefined {
  const raw = req.headers.get("x-vercel-ip-city");
  let city = raw ?? "";
  try {
    city = raw ? decodeURIComponent(raw) : "";
  } catch {
    // Leave it encoded rather than lose it.
  }
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const where = [city, country].filter(Boolean).join(", ");
  return where || undefined;
}

export function record(ask: Ask): Promise<void> {
  const d = new Date(ask.at);
  const { time } = stamp(Number.isNaN(+d) ? new Date() : d);
  const name = `${ask.session}/${pad(ask.turn)}-${time}${ask.flag ? `-${ask.flag}` : ""}.json`;
  const body = JSON.stringify(ask);
  return (hasBlob() ? putBlob(name, body) : putLocal(name, body)).catch((err) => {
    console.warn("asks: not recorded", err);
  });
}

async function putBlob(name: string, body: string) {
  await put(PREFIX + name, body, {
    access: "private",
    addRandomSuffix: false,
    // The same turn retried within one second lands on the same name.
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function putLocal(name: string, body: string) {
  const file = path.join(LOCAL_DIR, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body, "utf8");
}

/* ── Reading, for the dashboard ─────────────────────────────────────── */

const LIST_TTL_MS = 60 * 1000;
let listed: { at: number; sessions: SessionRef[] } | null = null;

function parseName(rel: string): TurnRef | null {
  const [session, file] = rel.split("/");
  if (!session || !file || !SESSION_RE.test(session)) return null;
  const m = FILE_RE.exec(file);
  if (!m) return null;
  const day = session.slice(0, 8);
  const t = m[2]!;
  const at = new Date(Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8), +t.slice(0, 2), +t.slice(2, 4), +t.slice(4, 6)));
  return { path: rel, session, turn: +m[1]!, at, flag: m[3] as Flag | undefined };
}

async function allNames(): Promise<string[]> {
  if (hasBlob()) {
    const names: string[] = [];
    let cursor: string | undefined;
    // Five pages is five thousand turns, and five operations. Enough.
    for (let page = 0; page < 5; page++) {
      const res = await list({ prefix: PREFIX, limit: 1000, cursor });
      for (const b of res.blobs) names.push(b.pathname.slice(PREFIX.length));
      if (!res.hasMore || !res.cursor) break;
      cursor = res.cursor;
    }
    return names;
  }
  try {
    const dirs = await readdir(LOCAL_DIR, { withFileTypes: true });
    const names: string[] = [];
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      for (const f of await readdir(path.join(LOCAL_DIR, d.name))) names.push(`${d.name}/${f}`);
    }
    return names;
  } catch {
    return [];
  }
}

/** Every conversation, newest first, from pathnames alone. Cached a minute. */
export async function sessions(): Promise<SessionRef[]> {
  const now = Date.now();
  if (listed && now - listed.at < LIST_TTL_MS) return listed.sessions;
  const by = new Map<string, SessionRef>();
  for (const rel of await allNames()) {
    const t = parseName(rel);
    if (!t) continue;
    const s = by.get(t.session) ?? { id: t.session, at: parseName(`${t.session}/01-${t.session.slice(9, 15)}.json`)!.at, turns: [] };
    s.turns.push(t);
    by.set(t.session, s);
  }
  const out = [...by.values()];
  for (const s of out) s.turns.sort((a, b) => a.turn - b.turn || +a.at - +b.at);
  out.sort((a, b) => (a.id < b.id ? 1 : -1));
  listed = { at: now, sessions: out };
  return out;
}

async function readOne(rel: string): Promise<Ask | null> {
  try {
    let text: string;
    if (hasBlob()) {
      const res = await get(PREFIX + rel, { access: "private" });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      text = await new Response(res.stream).text();
    } else {
      text = await readFile(path.join(LOCAL_DIR, rel), "utf8");
    }
    return JSON.parse(text) as Ask;
  } catch (err) {
    console.warn(`asks: could not read ${rel}`, err);
    return null;
  }
}

/** The turns of the given sessions, in order, missing files skipped. */
export async function turnsOf(refs: SessionRef[]): Promise<Map<string, Ask[]>> {
  const flat = refs.flatMap((s) => s.turns);
  const read = await Promise.all(flat.map((t) => readOne(t.path)));
  const out = new Map<string, Ask[]>();
  flat.forEach((t, i) => {
    const a = read[i];
    if (!a) return;
    const arr = out.get(t.session) ?? [];
    arr.push(a);
    out.set(t.session, arr);
  });
  return out;
}
