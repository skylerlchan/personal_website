import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * His own words, kept off the repo.
 *
 * The repo is public and llms.txt is crawled, and he wants neither to carry
 * the full collection of what he has written about himself. So the corpus
 * lives in Vercel Blob, at an address only the deployment knows, and is
 * fetched once per instance and held in memory. Locally it is read from
 * `corpus/corpus.md`, which is gitignored.
 *
 * If neither is available the chat still works; it just knows less.
 */

const TTL_MS = 60 * 60 * 1000;
let cached: { text: string; at: number } | null = null;

export async function corpus(): Promise<string> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.text;

  let text = "";
  const url = process.env.CORPUS_URL?.trim();
  if (url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) text = await res.text();
      else console.warn(`corpus: ${res.status} from blob`);
    } catch (err) {
      console.warn("corpus: fetch failed", err);
    }
  }
  if (!text) {
    try {
      text = await readFile(path.join(process.cwd(), "corpus", "corpus.md"), "utf8");
    } catch {
      // No local copy either. Fine.
    }
  }
  cached = { text, at: now };
  return text;
}
