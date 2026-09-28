import { ENTRIES, type Entry } from "@/content/resume";

/**
 * Which of his projects an answer is talking about.
 *
 * The obvious design is to make the model emit markers like [exahuman] and
 * parse them out. This does not do that, for three reasons: it costs output
 * tokens on every answer, it needs a parser that copes with a marker arriving
 * split across two stream chunks, and a model can emit an id that does not
 * exist, which is a fabricated citation on the one page whose whole argument
 * is that you can check the claims.
 *
 * Matching the names the answer already used has none of those problems. If
 * the text does not name the thing, no source is shown, and an answer with no
 * source is visibly an answer with no source.
 */

/** Entries named in `text`, in the order they first appear. */
export function cited(text: string): Entry[] {
  if (!text) return [];
  const hay = text.toLowerCase();
  const hits: { e: Entry; at: number }[] = [];

  for (const e of ENTRIES) {
    let first = -1;
    for (const needle of [e.title, ...(e.match ?? [])]) {
      const n = needle.toLowerCase();
      // Word boundaries, so "carry" does not fire inside "carrying" and
      // "piano" does not fire inside a longer word.
      const at = hay.search(new RegExp(`(^|[^a-z0-9])${escapeRe(n)}([^a-z0-9]|$)`));
      if (at !== -1 && (first === -1 || at < first)) first = at;
    }
    if (first !== -1) hits.push({ e, at: first });
  }

  return hits.sort((a, b) => a.at - b.at).map((h) => h.e);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split an answer into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** Pieces of a paragraph, with links pulled out so they can be anchors. */
export type Piece = { kind: "text" | "link"; value: string; href?: string };

export function linkify(text: string): Piece[] {
  const out: Piece[] = [];
  const re = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", value: text.slice(last, at) });
    const v = m[0];
    out.push({ kind: "link", value: v, href: v.includes("@") ? `mailto:${v}` : v });
    last = at + v.length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}
