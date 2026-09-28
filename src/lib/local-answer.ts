import { ENTRIES, ELSEWHERE, QA, type Entry } from "@/content/resume";

/**
 * The chat, with no model behind it.
 *
 * There is no funded key on this site, and a chat that says "something broke"
 * is worse than no chat. So this answers from the same facts the page is built
 * from: it finds the entries a question is about and replies with what they
 * actually say. His own sentences, not a paraphrase of them.
 *
 * It is retrieval and templates, not a language model, and it does not pretend
 * otherwise. What it buys is that every answer is true by construction. It
 * cannot invent a number, because it has no way to write one that is not in
 * `resume.ts`, which is also what the page and the citation matcher read. The
 * model path stays in place and takes over the moment a key works.
 *
 * It also answers a few plain commands, because people type "projects" into a
 * box far more often than anyone designing one expects.
 */

const EMAIL = "skylerlchan@gmail.com";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Words that should pull up an entry even when its name is never typed. */
const TOPIC: Record<string, string[]> = {
  multiplier: ["hedge fund", "hedge funds", "yc", "y combinator", "startup", "agent", "agents", "arr", "revenue", "founding", "vs code fork", "enterprise", "founding engineer"],
  exahuman: ["robot", "robots", "robotics", "teleop", "teleoperation", "robot arm", "mujoco", "actuator", "actuators", "humanoid", "delivery dog", "teleoperation lab"],
  carry: ["trade", "trading", "quant", "crypto", "bitcoin", "btc", "funding", "sharpe", "backtest", "backtesting", "arbitrage", "delta neutral", "paragon", "finance", "hedge", "strategy", "paper", "ssrn"],
  hoverloon: ["blimp", "airship", "balloon", "drone", "aerial", "logistics", "payload", "buoyant"],
  betaflow: ["browser", "vs code", "vscode", "extension", "marketplace", "tabs", "editor", "open source", "downloads"],
  kalshi: ["kalshi", "prediction market", "prediction markets", "bot", "bets", "betting", "contracts", "edge"],
  retrieval: ["retrieval", "rag", "benchmark", "benchmarked", "embedding", "embeddings", "search", "recall", "hybrid", "evaluation", "eval"],
  lastcurb: ["parking", "park", "curb", "kerb", "nyc", "new york", "traffic", "camera", "cameras", "computer vision", "cv", "reverse engineer", "reverse engineered"],
  hmei: ["climate", "geoengineering", "aerosol", "aerosols", "sulfate", "black carbon", "soot", "rainfall", "research", "modeling", "modelling", "princeton", "science", "paper"],
  piano: ["piano", "music", "classical", "bach", "ravel", "liszt", "debussy", "beethoven", "hiromi", "recording", "recordings", "instrument"],
  squash: ["squash", "sport", "sports", "racquet", "athletics"],
};

function score(e: Entry, q: string): number {
  let s = 0;
  for (const raw of [e.title, ...(e.match ?? [])]) {
    const n = norm(raw);
    if (n && q.includes(n)) s += 12 + n.length / 10;
  }
  for (const w of TOPIC[e.id] ?? []) if (q.includes(w)) s += 4;
  return s;
}

function sentence(e: Entry): string {
  const stat = e.stat ? ` ${e.stat.value}${e.stat.unit ? ` ${e.stat.unit}` : ""}, ${e.stat.note}.` : "";
  // The title is stated, not lowercased into the claim, because the citation
  // matcher finds sources by looking for the title in the answer text.
  return `${e.title}. ${e.claim}. ${e.line}${stat}`;
}

const hit = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/** Joins paragraphs without leaving the double blank lines an empty item makes. */
const para = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join("\n\n");

const CURRENT = ["exahuman", "kalshi"];
const HEADLINE = ["exahuman", "multiplier", "carry"];

/** A written answer, or null when nothing sensible can be said. */
export function localAnswer(question: string): string | null {
  const q = norm(question);
  if (!q) return null;

  // Plain commands, because people type these into a box.
  if (q === "help" || q === "commands" || q === "menu") {
    return [
      "Ask me anything about Skyler. Things I can answer well:",
      "",
      "his work, or any one project by name",
      "what he is building right now",
      "robotics, trading, climate research, piano",
      "how to reach him",
    ].join("\n");
  }
  if (q === "projects" || q === "work" || q === "list" || q === "everything") {
    return [
      "Everything on the page, shortest version:",
      "",
      ...ENTRIES.filter((e) => e.group !== "hobbies").map((e) => `${e.title}. ${e.claim}.`),
      "",
      "Ask about any one of them and I will go deeper.",
    ].join("\n");
  }

  // Someone poking the box, not asking about him.
  if (/^(does (this|it) work|is this (working|real|a bot)|test(ing)?|hello\??|wtf|lol|huh|what|ok(ay)?|cool|nice|thanks?( you)?|thx)[?!. ]*$/.test(q)) {
    return "It works. Ask me about a project by name, what he is building right now, or what to hire him for.";
  }

  // Greetings.
  if (/^(hi|hey|hello|yo|sup|hola|howdy)\b/.test(q) && q.length < 24) {
    return "Hey. Ask me about anything Skyler has built. Exahuman and Multiplier are the two he would lead with, and the BTC funding carry is the one with a paper behind it.";
  }

  // Strengths, in his words and the resume's, separate from the hiring pitch.
  if (hit(q, "strength", "strengths", "good at", "best at", "skills", "superpower", "what is he like")) {
    return para(
      "He ships end to end. At Multiplier he owned the product for six enterprise clients and wrote about 30% of the codebase, the largest share on the team. He builds hardware as well as software: Hoverloon and Exahuman are his, funded and staffed by him. And he does the numbers himself: the BTC funding carry is a sole-author SSRN paper with the code public.",
      "What he says drives it: getting immersed in a sticky problem and letting his mind explore novel solutions, which he calls addictive.",
    );
  }

  // What he is for. This has to run before the contact intent, which used to
  // catch "hire" and hand back an email address, which is not an answer.
  if (hit(q, "hire", "hiring", "recruit", "what does he do", "what can he do", "role", "fit", "why him", "what should i")) {
    const top = HEADLINE.map((id) => ENTRIES.find((e) => e.id === id)).filter(Boolean) as Entry[];
    return para(
      "Hire him to build the thing nobody has built yet, then measure whether it worked. That is the pattern in everything here.",
      "He was the founding engineer at Multiplier, a Y Combinator startup: an AI harness for hedge-fund analysts, a VS Code fork with agents inside it, which he owned end to end for six firms and took to $208K ARR. He founded Exahuman, a robot teleoperation lab, and funded and staffed it. And he wrote a quant paper on a delta-neutral BTC funding carry, Sharpe 6.1 over three years of tick data, with the code public so you can check it.",
      "So: an engineer who ships products with real users, comfortable across software, hardware and quant research, and honest about what the numbers say. Princeton ORFE, class of 2028. Email him at skylerlchan@gmail.com.",
    );
  }

  // Reaching him.
  if (hit(q, "contact", "email", "reach", "get in touch", "talk to him", "message him", "resume", "cv", "linkedin", "github", "twitter")) {
    return [
      `Email is best: ${EMAIL}.`,
      "",
      ELSEWHERE.filter((l) => !l.href.startsWith("mailto:")).map((l) => `${l.label}: ${l.href}`).join("\n"),
      "",
      "He is open to interesting problems.",
    ].join("\n");
  }

  // Score the entries now, not later: an explicitly named project beats every
  // generic intent below it. "Tell me about the robotics" was answering with
  // his biography because the bio intent ran first and matched "tell me about".
  const ranked = ENTRIES.map((e) => ({ e, s: score(e, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const named = ranked.length > 0 && ranked[0].s >= 4;

  // Who he is.
  if (!named && hit(q, "who is", "who are", "about him", "about you", "tell me about", "background", "introduce", "summary", "overview", "yourself")) {
    return para(
      "Skyler Chan, Princeton 2028, operations research and financial engineering with a computer science minor.",
      "He loves building, and gravitates to wacky ideas. Founding engineer at Multiplier, a Y Combinator startup selling AI agents to hedge funds. Founder of Exahuman, a robot teleoperation lab. Two SSRN papers, one on a delta-neutral BTC funding carry and one out of Princeton HMEI on solar geoengineering.",
      "Ask about any of those and I will go deeper.",
    );
  }

  // What is he doing now.
  if (hit(q, "right now", "currently", "these days", "working on", "building now", "what is he building", "what are you building", "up to", "latest", "recent", "nowadays", "at the moment", "what is he doing", "what does he do now")) {
    const live = CURRENT.map((id) => ENTRIES.find((e) => e.id === id)).filter(Boolean) as Entry[];
    return para("Two things are live right now:", ...live.map(sentence));
  }

  // The best of it. "Best" and "favourite" only count alongside a word about
  // his work, or "what is his favourite colour" gets answered with robotics.
  const superlative =
    hit(q, "proudest", "proud of", "most impressive", "highlight", "should i know", "stand out", "standout") ||
    (hit(q, "best", "favourite", "favorite", "biggest", "strongest", "top") &&
      hit(q, "project", "projects", "work", "build", "built", "thing", "things", "achievement", "accomplishment", "he done", "you done"));
  if (superlative) {
    const top = HEADLINE.map((id) => ENTRIES.find((e) => e.id === id)).filter(Boolean) as Entry[];
    return para("The three he would lead with:", ...top.map(sentence));
  }

  // His own answers, which are better than anything I would write.
  const qa = QA.find((x) => {
    const k = norm(x.q);
    if (q.includes(k)) return true;
    if (hit(q, "why do you build", "why build", "why does he build", "motivation", "what drives")) return k.includes("why do you build");
    if (hit(q, "ten years", "10 years", "future", "long term", "vision", "next decade")) return k.includes("ten years");
    if (hit(q, "fun fact", "something fun", "interesting fact", "birthday")) return k.includes("fun fact");
    if (hit(q, "a day", "best day", "favourite day", "favorite day", "enjoyed")) return k.includes("day you enjoyed");
    return false;
  });
  if (qa) return para("In his own words, from his TreeHacks application:", ...qa.a);

  // Otherwise: whichever entries the question is actually about. One entry if
  // it was named outright, up to three if the question was only topical.
  if (ranked.length) {
    const picked = ranked.slice(0, ranked[0].s >= 12 ? 1 : 3).map((x) => x.e);
    const links = picked.flatMap((e) => e.links ?? []);
    return para(...picked.map(sentence), links.length ? links.map((l) => `${l.label}: ${l.href}`).join("\n") : null);
  }

  // Nothing matched. Say so, and be useful anyway.
  return para(
    "I do not have anything on that. I only know what is on this page, which is his work, his research and what he does outside it.",
    `Try a project by name, or ask what he is building right now. For anything else, email him at ${EMAIL}.`,
  );
}
