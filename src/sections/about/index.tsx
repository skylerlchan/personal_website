import Section from "@/components/primitives/Section";

export const meta = { id: "about", label: "About" };

const FACTS = [
  { label: "Currently", value: "Founding Engineer, WithAI Research (YC P26)" },
  { label: "Studying", value: "Princeton University" },
  { label: "Researching", value: "Climate, robotics, LLMs" },
  { label: "Based in", value: "Princeton, NJ" },
];

export default function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title={
        <>
          I build systems at the edge of <span className="text-accent">research and production</span>.
        </>
      }
      description="From stratospheric climate models to LLM infrastructure for hedge funds, I move between deep research and shipping product. The throughline: building things that actually work in the messy real world."
    >
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
        {FACTS.map((f) => (
          <div key={f.label} className="bg-background p-6 sm:p-8">
            <dt className="text-xs font-mono uppercase tracking-[0.18em] text-muted">
              {f.label}
            </dt>
            <dd className="mt-3 text-lg sm:text-xl text-foreground tracking-tight">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
