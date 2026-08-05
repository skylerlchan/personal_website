import Section from "@/components/primitives/Section";
import { WALKTHROUGHS } from "./data";
import WalkthroughCard from "./WalkthroughCard";

export const meta = { id: "walkthroughs", label: "Walkthroughs" };

export default function Walkthroughs() {
  if (WALKTHROUGHS.length === 0) {
    return (
      <Section
        id="walkthroughs"
        eyebrow="Walkthroughs"
        title="Product tours, coming up"
        description="Polished video walkthroughs (Screen Studio) and interactive demos (Arcade) ship here as projects roll out. Check back, or drop a note below if you want a private tour."
      >
        <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-subtle mb-3">
            Empty state
          </div>
          <p className="text-muted max-w-md mx-auto leading-relaxed">
            Add an entry to{" "}
            <code className="font-mono text-foreground bg-surface px-1.5 py-0.5 rounded">
              src/sections/walkthroughs/data.ts
            </code>{" "}
            — video MP4 or iframe URL — and it appears here.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="walkthroughs"
      eyebrow="Walkthroughs"
      title="Product tours"
      description="Polished walkthroughs of recent work — recorded with Screen Studio, embedded with Arcade."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {WALKTHROUGHS.map((w) => (
          <WalkthroughCard key={w.slug} w={w} />
        ))}
      </div>
    </Section>
  );
}
