import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { get, list } from "@vercel/blob";

/**
 * His own words, kept off the repo.
 *
 * The repo is public and llms.txt is crawled, and he wants neither to carry
 * the full collection of what he has written about himself. So the corpus
 * lives in a private Vercel Blob store connected to the project, which puts
 * BLOB_STORE_ID in the environment (and a read-write token, if that box was
 * ticked). It is read once per instance and
 * held in memory for an hour. Locally it is read from `corpus/corpus.md`,
 * which is gitignored.
 *
 * If neither is available the chat still works; it just knows less.
 */

const TTL_MS = 60 * 60 * 1000;
const NAME = process.env.CORPUS_BLOB?.trim() || "corpus.md";
let cached: { text: string; at: number } | null = null;

async function fromBlob(): Promise<string> {
  // Connecting the store to the project set BLOB_STORE_ID (the read-write
  // token is a separate, off-by-default checkbox). On Vercel the SDK can
  // authenticate from the store id plus the function's own identity, so
  // either variable is reason enough to try; a failure is caught above.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return "";
  // Newest first: the dashboard gives a re-upload a suffixed name rather
  // than overwriting, and the newest one is the one he meant.
  const { blobs } = await list({ prefix: NAME.replace(/\.md$/, ""), limit: 20 });
  const hit = [...blobs].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0];
  if (!hit) {
    console.warn(`corpus: no blob named ${NAME}`);
    return "";
  }
  const res = await get(hit.url, { access: "private" });
  if (!res || res.statusCode !== 200 || !res.stream) {
    console.warn(`corpus: get returned ${res?.statusCode}`);
    return "";
  }
  return await new Response(res.stream).text();
}

async function fromDisk(): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), "corpus", "corpus.md"), "utf8");
  } catch {
    return "";
  }
}

export async function corpus(): Promise<string> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.text;
  let text = "";
  try {
    text = await fromBlob();
  } catch (err) {
    console.warn("corpus: blob read failed", err);
  }
  if (!text) text = await fromDisk();
  cached = { text, at: now };
  return text;
}
