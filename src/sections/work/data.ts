import { MULTIPLIER_URL } from "@/lib/constants";

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
    slug: "multiplier",
    company: "Multiplier — WithAI Research",
    role: "Founding Engineer",
    period: "2026 — Present",
    blurb:
      "YC P26. Multiplier is AI for asset managers — frontier agents that research across names, plug into the stack a firm already runs on (Bloomberg, FactSet, Aladdin), and learn how that firm actually makes decisions. It ships as a desktop app with packaged agent abilities, running on the client's own cloud. I build the agent runtime, the abilities system and the LLM infrastructure under it.",
    tags: ["Agents", "LLM infra", "TypeScript", "Python"],
    href: MULTIPLIER_URL || undefined,
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
