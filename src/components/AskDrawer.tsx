"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { SAMPLE_QUESTIONS } from "@/content/context";
import { cited, linkify, paragraphs } from "@/lib/cite";
import Thinking from "@/components/Thinking";

/**
 * The model, in a drawer on the right.
 *
 * Everything the research asked for is still here, just moved off the front
 * page: sources under every answer with the entry's own number, a real Stop
 * that aborts the request server side, failures that hand your question back,
 * and a stream batched to one render per frame.
 */

type Turn = { role: "user" | "assistant"; content: string };

const FAILURES = [
  "That did not go through. Your question is back in the box.",
  "The connection dropped partway. Try again, or email him at skylerlchan@gmail.com.",
  "Still not working. Skip me and email him at skylerlchan@gmail.com.",
];

function Answer({ text, live }: { text: string; live: boolean }) {
  const sources = cited(text);
  return (
    <div className="py-4">
      <div aria-live={live ? "polite" : undefined} className="text-[0.9375rem] leading-relaxed text-[var(--dim)]">
        {text ? (
          paragraphs(text).map((para, i) => (
            <p key={i} className={i ? "mt-3" : ""}>
              {linkify(para).map((piece, j) =>
                piece.kind === "link" ? (
                  <a
                    key={j}
                    href={piece.href}
                    target={piece.href?.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current"
                  >
                    {piece.value}
                  </a>
                ) : (
                  <span key={j}>{piece.value}</span>
                ),
              )}
            </p>
          ))
        ) : (
          <Thinking />
        )}
      </div>

      {sources.length > 0 && (
        <p className="label mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.625rem] text-[var(--faint)]">
          <span>Source</span>
          {sources.map((e) => (
            <Link
              key={e.id}
              href={`/#${e.id}`}
              className="text-[var(--dim)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent)]"
            >
              {e.title}
              {e.stat ? ` · ${e.stat.value}${e.stat.unit ? ` ${e.stat.unit}` : ""}` : ""}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}

export default function AskDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const fails = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const raf = useRef(0);
  const buffer = useRef("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 420);
  }, [open]);

  useEffect(() => {
    if (turns.length) endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function stop() {
    abort.current?.abort();
    abort.current = null;
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(draft);
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setDraft("");
    setBusy(true);
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns([...next, { role: "assistant", content: "" }]);

    const ctrl = new AbortController();
    abort.current = ctrl;
    buffer.current = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const why = (await res.text().catch(() => "")) || FAILURES[fails.current++ % FAILURES.length];
        setTurns([...next, { role: "assistant", content: why }]);
        setDraft(q);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer.current += decoder.decode(value, { stream: true });
        if (!raf.current) {
          raf.current = requestAnimationFrame(() => {
            raf.current = 0;
            setTurns([...next, { role: "assistant", content: buffer.current }]);
          });
        }
      }
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      // A stream that closed with nothing in it must still say something.
      const finalText = buffer.current.trim() ? buffer.current : "I would rather not answer that one. Ask me about his work?";
      setTurns([...next, { role: "assistant", content: finalText }]);
      fails.current = 0;
    } catch (err) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      if ((err as Error)?.name === "AbortError") {
        setTurns([...next, { role: "assistant", content: buffer.current }]);
      } else {
        setTurns([...next, { role: "assistant", content: FAILURES[fails.current++ % FAILURES.length] }]);
        setDraft(q);
      }
    } finally {
      abort.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const started = turns.length > 0;

  return (
    <aside className="drawer" data-open={open} aria-hidden={!open} aria-label="Ask about Skyler">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--line)] px-5">
        <span className="label text-[var(--ink)]">Ask Skyler</span>
        <span className="label ml-auto flex items-center gap-3 text-[var(--faint)]">
          {started && (
            <button type="button" onClick={() => setTurns([])} className="transition-colors hover:text-[var(--ink)]">
              Reset
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="text-[1rem] leading-none transition-colors hover:text-[var(--ink)]">
            ×
          </button>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {!started ? (
          <div className="flex h-full flex-col justify-end pb-4">
            <h2 className="display text-[1.75rem]">Hey, ask away.</h2>
            <ul className="mt-5 space-y-2.5">
              {SAMPLE_QUESTIONS.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => ask(q)}
                    className="group flex w-full items-baseline gap-2 text-left text-[0.9375rem] text-[var(--dim)] transition-colors hover:text-[var(--ink)]"
                  >
                    <span aria-hidden className="text-[var(--faint)] transition-colors group-hover:text-[var(--accent)]">
                      ↳
                    </span>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-4">
            {turns.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="flex justify-end py-2">
                  <p className="max-w-[88%] rounded-[1rem] rounded-br-sm bg-[var(--said)] px-3.5 py-2 text-[0.9375rem] leading-snug">
                    {t.content}
                  </p>
                </div>
              ) : (
                <Answer key={i} text={t.content} live={busy && i === turns.length - 1} />
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="field flex items-end gap-2 py-2 pl-3.5 pr-2"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about Skyler..."
            aria-label="Ask about Skyler"
            className="min-w-0 flex-1 resize-none bg-transparent py-1 text-[0.9375rem] leading-snug outline-none placeholder:text-[var(--faint)]"
          />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Stop" className="send">
              <span aria-hidden className="block h-2 w-2 rounded-[1px] bg-current" />
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim()} aria-label="Ask" className="send">
              <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
              </svg>
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
