import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { after, NextRequest } from "next/server";
import { systemPrompt } from "@/content/context";
import { guard, abusive, strike, ipTag } from "@/lib/guard";
import { localAnswer } from "@/lib/local-answer";
import { record, sessionFor, whereOf, type Ask, type Flag } from "@/lib/asks";

/**
 * The chat behind the website.
 *
 * Two providers, chosen by whichever key is actually usable:
 *
 *   ANTHROPIC_API_KEY   Claude, through the official SDK.
 *   GEMINI_API_KEY      Gemini's free tier, through its OpenAI-compatible
 *   or OPENAI_API_KEY   endpoint. The same code path serves Groq, Cerebras,
 *                       OpenRouter and Together: point OPENAI_BASE_URL at them.
 *
 * With neither key, and whenever the configured one fails, it answers from
 * `resume.ts` instead of apologising. See `lib/local-answer`. That path cannot
 * invent a fact, so the chat is never wrong, only sometimes less fluent.
 *
 * Streams either way, so the first words arrive immediately. Every turn is
 * written to the ask log once the answer is out (see `lib/asks`), which is
 * how Skyler sees what people ask; the write happens after the response and
 * never slows it. Nothing is sent to Telegram from here any more.
 */

const MAX_TURNS = 12; // bounds the prompt an abuser can make the model read
const MAX_CHARS = 2000;

export const dynamic = "force-dynamic";

/**
 * A well-formed Anthropic key. Note that well-formed is not the same as
 * funded: a key with no credit is shaped correctly and still fails, which is
 * exactly the state this site was in, so the free provider below takes
 * precedence whenever it is configured. Set CHAT_PROVIDER=anthropic to
 * override that.
 */
function anthropicKey(): string | null {
  const k = process.env.ANTHROPIC_API_KEY?.trim();
  return k && k.startsWith("sk-ant-") ? k : null;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";

/**
 * Which OpenAI-compatible provider, if any.
 *
 * A Gemini key with no OPENAI_BASE_URL means Gemini, full stop. OPENAI_API_KEY
 * only counts when a base URL says where it belongs. That order matters: his
 * shell exports an OpenAI key for other projects, and the first version of
 * this function sent it to Google, which answered "Please pass a valid API
 * key" while a perfectly good Gemini key sat unused in .env.local.
 */
function openaiCompatible(): { base: string; key: string; model: string } | null {
  const gemini = process.env.GEMINI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const base = process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gemini-3.5-flash-lite";
  if (base) {
    const key = openai || gemini;
    return key ? { base, key, model } : null;
  }
  return gemini ? { base: GEMINI_BASE, key: gemini, model } : null;
}

type Turn = { role: "user" | "assistant"; content: string };

const ipHash = (req: NextRequest) => createHash("sha256").update(ipTag(req)).digest("hex").slice(0, 8);

export async function POST(req: NextRequest) {
  // Before anything that costs money: is this a reader, or someone else's app?
  const refused = guard(req);
  if (refused) return new Response(refused.message, { status: refused.status });

  // Free first. A configured Gemini or OpenAI-compatible key wins unless
  // CHAT_PROVIDER says otherwise, because a funded Anthropic key is the
  // exception here and an unfunded one fails in a way presence cannot detect.
  const forced = process.env.CHAT_PROVIDER?.trim().toLowerCase();
  const compatAvailable = openaiCompatible();
  const anthAvailable = anthropicKey();

  const useAnthropic =
    forced === "anthropic" ? !!anthAvailable : forced === "gemini" || forced === "openai" ? false : !compatAvailable && !!anthAvailable;

  const anth = useAnthropic ? anthAvailable : null;
  const compat = useAnthropic ? null : compatAvailable;

  let turns: Turn[];
  let session: string;
  try {
    const body = await req.json();
    turns = Array.isArray(body?.messages) ? body.messages : [];
    // The drawer sends back the id it was given on its first turn, so the
    // log can keep a conversation together. Anything malformed gets a new one.
    session = sessionFor(body?.session);
  } catch {
    return new Response("Bad request.", { status: 400 });
  }

  const clean = turns
    .filter((t) => (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string" && t.content.trim())
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }));

  const last = clean[clean.length - 1];
  if (!last || last.role !== "user") return new Response("Expected a question.", { status: 400 });

  const started = Date.now();
  const base: Omit<Ask, "a" | "model" | "ms"> = {
    at: new Date(started).toISOString(),
    session,
    turn: clean.filter((t) => t.role === "user").length,
    q: last.content,
    where: whereOf(req),
    ua: req.headers.get("user-agent")?.slice(0, 200) || undefined,
    ipHash: ipHash(req),
  };
  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
    "X-Ask-Session": session,
  };

  // Abuse is refused before any model sees it, and counted. Three in a day
  // and the address is out for a day. The log keeps the real address on
  // these turns, so he can add it to CHAT_BLOCKED_IPS if it keeps coming.
  if (abusive(last.content)) {
    const blocked = strike(req);
    const a = blocked
      ? "That is enough of that. This address is blocked from the chat for a day."
      : "I only answer questions about Skyler. Ask me about his work, or email him at skylerlchan@gmail.com.";
    after(() => record({ ...base, a, model: "none", ms: 0, ip: ipTag(req), flag: blocked ? "blocked" : "abuse" }));
    return new Response(a, { status: blocked ? 403 : 200, headers });
  }

  const encoder = new TextEncoder();
  const system = await systemPrompt();

  // Filled in as the answer streams; written to the log once it has ended.
  let answer = "";
  let model = "local";
  let flag: Flag | undefined;
  let settle!: () => void;
  const ended = new Promise<void>((r) => (settle = r));

  const stream = new ReadableStream({
    async start(controller) {
      let streamed = false;
      const say = (s: string) => {
        if (s) streamed = true;
        answer += s;
        controller.enqueue(encoder.encode(s));
      };
      try {
        if (!anth && !compat) {
          // No key at all. Answer from the facts rather than apologising.
          await sayLocally(last.content, req, say);
        } else if (anth) {
          model = await runClaude({ key: anth, system, clean, req, say });
        } else {
          model = await runCompatible({ compat: compat!, system, clean, req, say });
        }
        // The model can return nothing: a safety filter, a truncated
        // stream. A blank answer leaves the reader watching the dots forever.
        if (!streamed && !req.signal.aborted) {
          // Google sometimes returns nothing at all (a safety or recitation
          // filter). The local answerer knows the plain facts, so it goes
          // first; the canned line is only for a question it cannot place.
          const local = localAnswer(last.content);
          flag = "empty";
          model = "local";
          say(local && !/^I do not have anything on that/.test(local)
            ? local
            : "That one is not on the page. Ask me about his work, or email him at skylerlchan@gmail.com.");
        }
      } catch (err) {
        if (req.signal.aborted) return;
        console.error("chat:", err);
        // The model failed. That is not the reader's problem, and the local
        // answer is usually the one they wanted. Only say so if nothing has
        // been streamed yet, so a half-finished answer is never glued to a
        // second one.
        flag = "failed";
        if (!streamed) {
          model = "local";
          await sayLocally(last.content, req, say, true);
        }
      } finally {
        if (req.signal.aborted) flag = "stopped";
        controller.close();
        settle();
      }
    },
  });

  // After the response, not during it: the write costs nothing to the reader.
  after(async () => {
    await ended;
    await record({ ...base, a: answer.slice(0, 6000), model, ms: Date.now() - started, flag });
  });

  return new Response(stream, { headers });
}

/**
 * The no-model path. Streamed a few words at a time, because an answer that
 * appears all at once in a chat window reads as canned even when it is right,
 * and because the drawer is already built to render a stream.
 */
async function sayLocally(question: string, req: NextRequest, say: (s: string) => void, afterFailure = false) {
  const text = localAnswer(question);
  if (!text) {
    say("Ask me about his work and I will tell you what I know.");
    return;
  }
  if (afterFailure) console.warn("chat: model unavailable, answered locally");

  const chunks = text.match(/\S+\s*/g) ?? [text];
  for (const chunk of chunks) {
    if (req.signal.aborted) return;
    say(chunk);
    await new Promise((r) => setTimeout(r, 14));
  }
}

/** Returns the model that answered, for the log. */
async function runClaude(o: { key: string; system: string; clean: Turn[]; req: NextRequest; say: (s: string) => void }): Promise<string> {
  const client = new Anthropic({ apiKey: o.key });
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const run = client.messages.stream({
    model,
    max_tokens: 1024,
    // Rejected by Haiku with a 400, so only sent to models that accept it.
    ...(model.startsWith("claude-haiku") ? {} : { output_config: { effort: "low" as const } }),
    // Byte-identical every request, so it caches.
    system: [{ type: "text", text: o.system, cache_control: { type: "ephemeral" } }],
    messages: o.clean,
  });
  o.req.signal.addEventListener("abort", () => run.abort());
  run.on("text", (chunk: string) => o.say(chunk));
  const done = await run.finalMessage();
  if (done.stop_reason === "refusal") o.say("I would rather not answer that one. Ask me about his work?");
  return model;
}

/**
 * Anything that speaks the OpenAI chat-completions protocol. Gemini's own
 * compatibility endpoint is the default because its free tier costs nothing
 * and needs no card. Returns the rung of the ladder that answered.
 */
async function runCompatible(o: {
  compat: { base: string; key: string; model: string };
  system: string;
  clean: Turn[];
  req: NextRequest;
  say: (s: string) => void;
}): Promise<string> {
  const ask = (model: string) =>
    fetch(`${o.compat.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${o.compat.key}` },
      signal: o.req.signal,
      body: JSON.stringify({
        model,
        // Thinking counts against this on Gemini 3.x: ~450 tokens of it on a
        // short prompt, more on the real one. 700 was cutting answers mid-sentence.
        max_tokens: 1500,
        stream: true,
        // Gemini 3.x thinks before it answers; low keeps that short, which is
        // both faster and cheaper against a free quota.
        reasoning_effort: "low",
        messages: [{ role: "system", content: o.system }, ...o.clean],
      }),
    });

  // The ladder, cheapest first. Everything here is free tier, so "cheap"
  // means allowance: the lite models have a large daily one, the newest
  // Flash a tiny one (twenty test calls exhausted it), and the free tier
  // throws "high demand" 503s in bursts. On 429, 503 or an unknown-model 404
  // the next rung is tried at once rather than the same model again.
  // OPENAI_MODELS overrides the whole list, comma separated.
  const ladder = [
    ...new Set(
      (process.env.OPENAI_MODELS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])
        .concat([o.compat.model, "gemini-3.1-flash-lite", "gemini-3.8-flash"]),
    ),
  ];
  let res: Response | null = null;
  let used = "";
  for (const model of ladder) {
    if (o.req.signal.aborted) return "none";
    const attempt = await ask(model);
    if (attempt.ok) {
      res = attempt;
      used = model;
      break;
    }
    const detail = await attempt.text().catch(() => "");
    const stepDown = [429, 503, 404].includes(attempt.status) || (attempt.status === 400 && /model/i.test(detail));
    console.warn(`chat: ${model} -> ${attempt.status}${stepDown ? ", next rung" : ""}`);
    if (!stepDown) throw new Error(`${attempt.status} ${detail.slice(0, 200)}`);
    res = attempt;
  }
  if (!res) throw new Error("no model attempted");
  if (used && used !== o.compat.model) console.warn(`chat: answered with ${used}`);

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${detail.slice(0, 200)}`);
  }

  // Server-sent events: `data: {json}` lines, terminated by `data: [DONE]`.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const lines = carry.split("\n");
    // The final element may be half a line; hold it for the next chunk.
    carry = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const piece = JSON.parse(payload)?.choices?.[0]?.delta?.content;
        if (typeof piece === "string" && piece) o.say(piece);
      } catch {
        // A malformed chunk is not worth killing the answer over.
      }
    }
  }
  return used;
}
