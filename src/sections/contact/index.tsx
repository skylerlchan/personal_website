import Section from "@/components/primitives/Section";
import { SITE_CONFIG } from "@/lib/constants";
import ContactForm from "./ContactForm";

export const meta = { id: "contact", label: "Contact" };

const SOCIALS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}`, handle: SITE_CONFIG.email },
  { label: "GitHub", href: "https://github.com/skylerlchan", handle: "@skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan", handle: "Skyler Chan" },
  { label: "X", href: "https://x.com/SkylerChan17", handle: "@SkylerChan17" },
  { label: "Instagram", href: "https://www.instagram.com/_.skyler.chan._/", handle: "@_.skyler.chan._" },
];

export default function Contact() {
  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let's talk"
      description="Building something interesting, hiring, or just want to say hi? Drop a note — or find me on any of the channels below."
    >
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
        <ContactForm />
        <ul className="divide-y divide-border border-y border-border">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-baseline justify-between gap-4 py-4 hover:text-accent transition-colors"
              >
                <span className="text-xs font-mono uppercase tracking-[0.15em] text-muted group-hover:text-accent transition-colors">
                  {s.label}
                </span>
                <span className="text-foreground group-hover:text-accent transition-colors text-right truncate">
                  {s.handle} <span aria-hidden>↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
