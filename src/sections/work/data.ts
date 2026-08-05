export type WorkItem = {
  slug: string;
  company: string;
  role: string;
  period: string;
  blurb: string;
  href?: string;
  tags: string[];
};

export const WORK: WorkItem[] = [
  {
    slug: "withai",
    company: "WithAI Research",
    role: "Founding Engineer",
    period: "2026 — Present",
    blurb:
      "YC P26. Building the core LLM platform and infrastructure for AI-native hedge funds.",
    tags: ["LLMs", "Infra", "Next.js", "Python"],
  },
  {
    slug: "hmei",
    company: "Princeton HMEI",
    role: "Research Assistant",
    period: "2024 — 2025",
    blurb:
      "Solar radiation management research. Showed stratospheric black carbon aerosols are 10× more cooling-effective than reflective sulfate.",
    tags: ["Climate", "Python", "Modeling"],
    href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit",
  },
];
