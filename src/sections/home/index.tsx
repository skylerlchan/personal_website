import Rail from "@/components/Rail";
import Card from "@/components/Card";
import { ENTRIES, ELSEWHERE, type Entry } from "@/content/resume";

/**
 * The front page: a claim and the work.
 *
 * Two blocks and nothing else. A display line that says what he is, and
 * three rails of what he built. He had the experience table cut; the cards
 * carry the employers. The model lives in the drawer, one click away
 * in the header, so the page itself stays a normal website.
 */

/** The rails. `rail` overrides the group, so a job can sit with the projects. */
const railOf = (e: Entry) => e.rail ?? (e.group === "work" ? "work" : "projects");
const WORK = ENTRIES.filter((e) => e.group !== "hobbies" && railOf(e) === "work");
const HOBBIES = ENTRIES.filter((e) => e.group === "hobbies");

/**
 * Independent projects, strongest first. Order is deliberate rather than
 * chronological: the current funded lab leads, the dormant repo trails.
 */
const ORDER = ["exahuman", "carry", "hoverloon", "betaflow", "kalshi", "retrieval", "lastcurb"];
const PROJECTS = ORDER.map((id) => ENTRIES.find((e) => e.id === id)).filter(Boolean) as Entry[];

/**
 * The wash, as three hue angles per entry rather than eleven hand-written
 * gradients. The recipe lives in one place in the CSS, so the set stays a set;
 * only the hues change here.
 *
 * Two rules picked the angles. Each wash leans on what the thing is, so the
 * colour is doing a little work rather than just being colour: soot and
 * atmosphere are cyan, a profitable trade is green, the city is amber. And no
 * two cards that sit next to each other in a rail share a family, because the
 * rail only ever shows one and a bit of a card on a phone and two warm washes
 * in a row read as the same card scrolled slightly.
 */
const HUES: Record<string, [number, number, number]> = {
  // Work
  multiplier: [232, 268, 210], // indigo into violet
  hmei: [196, 168, 220], // atmosphere
  // Independent projects, in rail order
  exahuman: [18, 340, 268], // the accent, for the flagship
  carry: [152, 176, 120], // green, the way a good trade is green
  hoverloon: [200, 222, 178], // sky
  betaflow: [258, 286, 228], // violet
  kalshi: [44, 24, 352], // gold into red
  retrieval: [208, 186, 240], // blue
  lastcurb: [8, 348, 322], // coral. Amber read as the same card as Kalshi
  // Outside work
  piano: [286, 316, 252],
  squash: [96, 130, 62],
};

const HUE_FALLBACK: [number, number, number] = [220, 240, 200];

/**
 * Lightness correction, in percentage points, for the hues that come out
 * perceptually too light. Yellow-green and pale blue at the same numbers as
 * orange or violet render far brighter, and the white drawing on top of them
 * was disappearing. Hue stays where it is; only the value moves.
 */
const LIFT: Record<string, number> = { squash: 9, retrieval: 5, carry: 3, hoverloon: 3 };

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[84rem] px-5 pb-24 sm:px-8">
      {/* ── The claim, and the record beside it ───────────────────────── */}
      <section className="pt-16 sm:pt-24">
        <h1 className="display max-w-[22ch] text-[clamp(2.5rem,7vw,4.5rem)] text-[var(--ink)]">
          I&rsquo;m Skyler, and I love building <em>wacky ideas</em>.
        </h1>
      </section>

      {/* ── Two rails, strongest first ────────────────────────────────── */}
      <Rail label="Work">
        {WORK.map((e) => (
          <Card key={e.id} e={e} hues={HUES[e.id] ?? HUE_FALLBACK} lift={LIFT[e.id] ?? 0} />
        ))}
      </Rail>

      <Rail label="Independent projects">
        {PROJECTS.map((e) => (
          <Card key={e.id} e={e} hues={HUES[e.id] ?? HUE_FALLBACK} lift={LIFT[e.id] ?? 0} />
        ))}
      </Rail>

      <Rail label="Outside work">
        {HOBBIES.map((e) => (
          <Card key={e.id} e={e} hues={HUES[e.id] ?? HUE_FALLBACK} lift={LIFT[e.id] ?? 0} />
        ))}
      </Rail>

      {/* ── Reach him ─────────────────────────────────────────────────── */}
      <section className="mt-16 border-t border-[var(--line)] pt-8">
        <h2 className="label text-[var(--faint)]">Contact</h2>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {ELSEWHERE.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[1rem] text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
            >
              {l.label}
            </a>
          ))}
        </p>
        <p className="label mt-8 text-[var(--faint)]">
          <a href="/llms.txt" className="underline underline-offset-4">
            /llms.txt
          </a>
        </p>
      </section>
    </main>
  );
}
