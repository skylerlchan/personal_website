import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sessions, turnsOf, type Ask, type SessionRef } from "@/lib/asks";
import { asksKey, COOKIE, keyMatches } from "@/lib/asks-auth";

/**
 * What people ask the chat. His eyes only.
 *
 * Reads the ask log (see `lib/asks`): the counts come from pathnames alone,
 * so the summary at the top costs one list() a minute at most, and only the
 * conversations on the current page are actually opened. Times are shown
 * in his time zone, not the server's.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What people ask",
  robots: { index: false, follow: false },
};

const TZ = "America/New_York";
const PAGE = 25;
const ANALYTICS = "https://vercel.com/skylerlchans-projects/personal_website_1/analytics";

const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const when = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
const weekday = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "narrow" }).format(d);

function device(ua?: string): string {
  if (!ua) return "";
  if (/bot|crawl|spider|curl|python|wget|httpclient|headless/i.test(ua)) return "bot";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(" ");
}

const flagged = (s: SessionRef) => s.turns.some((t) => t.flag === "abuse" || t.flag === "blocked");

type Search = Promise<{ key?: string; page?: string; bad?: string }>;

export default async function Asks({ searchParams }: { searchParams: Search }) {
  if (!asksKey()) notFound();
  const sp = await searchParams;
  if (sp.key) redirect(`/asks/go?key=${encodeURIComponent(sp.key)}`);
  const jar = await cookies();
  if (!keyMatches(jar.get(COOKIE)?.value)) return <Gate bad={!!sp.bad} />;

  const all = await sessions();
  const now = new Date();
  const today = dayOf(now);

  // The last fourteen days, oldest first, counted by his calendar.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86_400_000);
    return { key: dayOf(d), label: weekday(d), questions: 0, conversations: 0 };
  });
  const byDay = new Map(days.map((d) => [d.key, d]));
  const within = (n: number) => {
    const from = dayOf(new Date(now.getTime() - (n - 1) * 86_400_000));
    return all.filter((s) => dayOf(s.at) >= from);
  };
  for (const s of all) {
    const d = byDay.get(dayOf(s.at));
    if (!d) continue;
    d.conversations += 1;
    d.questions += s.turns.length;
  }
  const questions = (list: SessionRef[]) => list.reduce((n, s) => n + s.turns.length, 0);
  const peak = Math.max(1, ...days.map((d) => d.questions));
  const totals = [
    { label: "Today", list: all.filter((s) => dayOf(s.at) === today) },
    { label: "7 days", list: within(7) },
    { label: "30 days", list: within(30) },
    { label: "All", list: all },
  ];
  const flags = all.filter(flagged).length;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const slice = all.slice((page - 1) * PAGE, page * PAGE);
  const turns = await turnsOf(slice);

  return (
    <main className="mx-auto w-full max-w-[44rem] px-5 pb-24 sm:px-8">
      <section className="pt-14 sm:pt-20">
        <h1 className="display text-[clamp(2rem,6vw,3rem)] text-[var(--ink)]">What people ask</h1>
        <p className="mt-3 text-[0.9375rem] text-[var(--dim)]">
          Every question the chat has been asked, and what it said back. Page views live in{" "}
          <a href={ANALYTICS} className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            Vercel Analytics
          </a>
          .
        </p>
      </section>

      {/* ── The numbers ────────────────────────────────────────────────── */}
      <section className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {totals.map((t) => (
          <div key={t.label}>
            <p className="label text-[var(--faint)]">{t.label}</p>
            <p className="display mt-1.5 text-[2rem] text-[var(--ink)]">{questions(t.list)}</p>
            <p className="mt-1 text-[0.8125rem] text-[var(--dim)]">
              {t.list.length} conversation{t.list.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </section>

      {/* ── Fourteen days ──────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="flex h-16 items-end gap-1.5" role="img" aria-label="Questions a day for the last fourteen days">
          {days.map((d) => (
            <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.key}: ${d.questions} question${d.questions === 1 ? "" : "s"}, ${d.conversations} conversation${d.conversations === 1 ? "" : "s"}`}>
              <div
                className="w-full rounded-[3px] bg-[var(--ink)]"
                style={{ height: `${Math.max(d.questions ? 8 : 2, (100 * d.questions) / peak)}%`, opacity: d.questions ? (d.key === today ? 1 : 0.55) : 0.15 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {days.map((d) => (
            <span key={d.key} className="label flex-1 text-center text-[0.5625rem] text-[var(--faint)]">
              {d.label}
            </span>
          ))}
        </div>
        {flags > 0 && (
          <p className="mt-4 text-[0.8125rem] text-[var(--dim)]">
            <span className="text-[var(--accent)]">{flags}</span> conversation{flags === 1 ? "" : "s"} refused for abuse. The address is shown on those turns; paste it into CHAT_BLOCKED_IPS in Vercel to keep it out.
          </p>
        )}
      </section>

      {/* ── The conversations ──────────────────────────────────────────── */}
      <section className="mt-12">
        {slice.length === 0 ? (
          <p className="border-t border-[var(--line)] pt-8 text-[0.9375rem] text-[var(--dim)]">Nothing yet. The first question will show up here.</p>
        ) : (
          slice.map((s) => <Conversation key={s.id} s={s} turns={turns.get(s.id) ?? []} />)
        )}
      </section>

      {/* ── Paging, and the way out ────────────────────────────────────── */}
      <section className="mt-10 flex items-baseline gap-5 border-t border-[var(--line)] pt-6">
        {page > 1 && (
          <Link href={`/asks?page=${page - 1}`} className="label text-[var(--dim)] underline underline-offset-4 hover:text-[var(--ink)]">
            Newer
          </Link>
        )}
        {page < pages && (
          <Link href={`/asks?page=${page + 1}`} className="label text-[var(--dim)] underline underline-offset-4 hover:text-[var(--ink)]">
            Older
          </Link>
        )}
        <span className="label text-[var(--faint)]">
          Page {page} of {pages}
        </span>
        <a href="/asks/go?out=1" className="label ml-auto text-[var(--faint)] underline underline-offset-4 hover:text-[var(--ink)]">
          Sign out
        </a>
      </section>
    </main>
  );
}

function Conversation({ s, turns }: { s: SessionRef; turns: Ask[] }) {
  const first = turns[0];
  const bad = flagged(s);
  const n = s.turns.length;
  return (
    <article className="border-t border-[var(--line)] py-7">
      <header className="label flex flex-wrap gap-x-4 gap-y-1 text-[var(--faint)]">
        <time dateTime={s.at.toISOString()} className="text-[var(--dim)]">
          {when(s.at)}
        </time>
        {first?.where && <span>{first.where}</span>}
        {first?.ua && <span>{device(first.ua)}</span>}
        <span>
          {n} question{n === 1 ? "" : "s"}
        </span>
        {bad && <span className="text-[var(--accent)]">Refused</span>}
        {first && <span title="The same visitor has the same tag">#{first.ipHash}</span>}
      </header>

      {turns.length === 0 && <p className="mt-4 text-[0.875rem] text-[var(--faint)]">Could not read this conversation.</p>}

      {turns.map((t) => {
        const off = t.flag === "abuse" || t.flag === "blocked";
        return (
          <div key={`${t.turn}-${t.at}`} className={`mt-5 ${off ? "border-l-2 border-[var(--accent)] pl-4" : ""}`}>
            <p className="text-[0.9375rem] font-medium leading-snug text-[var(--ink)]">{t.q}</p>
            <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[var(--dim)]">{t.a || <span className="text-[var(--faint)]">(no answer)</span>}</p>
            <p className="label mt-2 flex flex-wrap gap-x-3 text-[0.5625rem] text-[var(--faint)]">
              {t.model !== "none" && <span>{t.model}</span>}
              {t.ms > 0 && <span>{(t.ms / 1000).toFixed(1)} s</span>}
              {t.flag && <span className={off ? "text-[var(--accent)]" : ""}>{t.flag}</span>}
              {t.ip && <span className="text-[var(--ink)]">{t.ip}</span>}
            </p>
          </div>
        );
      })}
    </article>
  );
}

function Gate({ bad }: { bad: boolean }) {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-[44rem] flex-col justify-center px-5 pb-24 sm:px-8">
      <h1 className="display text-[clamp(2rem,6vw,3rem)] text-[var(--ink)]">What people ask</h1>
      <p className="mt-3 text-[0.9375rem] text-[var(--dim)]">This page is for Skyler. It needs the key from the Vercel project.</p>
      <form action="/asks/go" method="get" className="field mt-6 flex items-center gap-2 py-2 pl-3.5 pr-2">
        <input
          name="key"
          type="password"
          autoComplete="current-password"
          autoFocus
          aria-label="Key"
          placeholder="Key"
          className="min-w-0 flex-1 bg-transparent py-1 text-[0.9375rem] outline-none placeholder:text-[var(--faint)]"
        />
        <button type="submit" className="send" aria-label="Open">
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
          </svg>
        </button>
      </form>
      {bad && <p className="mt-3 text-[0.8125rem] text-[var(--accent)]">That key did not match.</p>}
    </main>
  );
}
