import StoryLine from "./StoryLine";

export const meta = { id: "story", label: "Story" };

/**
 * The narrative, in the order it actually happened. Lead lines are the claim;
 * details are the evidence. Kept short on purpose — a line that wraps past two
 * lines on a phone loses the cadence the reveal depends on.
 */
const BEATS: { lead: string; detail?: string }[] = [
  { lead: "I started in the stratosphere." },
  {
    lead: "Black carbon cools the planet ten times better than the sulfate everyone models.",
    detail: "Two years at Princeton's High Meadows Environmental Institute, running the aerosol numbers.",
  },
  { lead: "Then I wanted things that move." },
  {
    lead: "So I crossed a blimp with a drone. Buoyancy did the lifting, so the motors didn't have to.",
    detail: "Nineteen times the payload. Two hours in the air instead of twenty minutes.",
  },
  { lead: "Now I build the agents that read markets." },
  {
    lead: "Founding engineer at Multiplier — frontier models running inside a fund's own cloud.",
    detail: "Y Combinator P26. The agent runtime, the abilities system, the infrastructure underneath.",
  },
  { lead: "Different fields. Same job." },
  { lead: "Get it out of the lab." },
];

export default function Story() {
  return (
    // Always paper, never dark. After a near-black hero this inversion is the
    // loudest thing on the page, and it costs nothing but a colour.
    <section
      id="story"
      className="w-full bg-[#fbfbf9] px-6 py-32 text-[#0a0a0a] sm:px-8 sm:py-44 lg:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-20 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-[#0a0a0a]/40 sm:mb-28">
          The short version
        </div>

        {BEATS.map((b, i) => (
          <div key={i} className={i === 0 ? "" : "mt-20 sm:mt-32"}>
            <StoryLine
              text={b.lead}
              className="text-[1.75rem] font-medium leading-[1.18] tracking-[-0.035em] sm:text-[2.75rem] lg:text-[3.25rem]"
            />
            {b.detail && (
              <StoryLine
                text={b.detail}
                delay={0.35}
                className="mt-6 max-w-xl text-base leading-relaxed tracking-tight text-[#0a0a0a]/55 sm:text-lg"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
