"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SOCIAL_LINKS, SITE_CONFIG } from "@/lib/constants";
import type { SocialLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ── Icons (larger for standalone cards) ── */
const ICONS: Record<SocialLink["icon"], React.ReactNode> = {
  github: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13 2 4" />
    </svg>
  ),
};

export default function Socials() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      tl.from(".socials-heading", { y: 20, autoAlpha: 0, duration: 0.6, immediateRender: false });
      tl.from(
        ".social-card",
        { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.4, ease: "power2.out", immediateRender: false },
        "-=0.3"
      );
      tl.from(".socials-footer", { autoAlpha: 0, duration: 0.5, immediateRender: false }, "-=0.2");
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="socials"
      data-snap
      data-project="socials"
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 pt-20 pb-4 sm:py-8"
    >
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="socials-heading mb-5 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Let&apos;s Connect
          </h2>
          <p className="mt-2 text-sm text-muted/60">
            Find me around the internet
          </p>
        </div>

        {/* Social cards */}
        <div className="flex flex-col gap-2 sm:gap-3">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.icon === "email" ? undefined : "_blank"}
              rel={link.icon === "email" ? undefined : "noopener noreferrer"}
              data-cursor="link"
              className={cn(
                "social-card group",
                "flex items-center gap-4 p-3 sm:p-4 rounded-2xl",
                "border border-foreground/[0.08] bg-surface/50 backdrop-blur-sm",
                "hover:border-accent/30 hover:bg-surface/80",
                "active:scale-[0.98]",
                "transition-all duration-300",
                "hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl shrink-0",
                  "bg-foreground/[0.04] flex items-center justify-center",
                  "text-muted/60 group-hover:text-accent",
                  "transition-colors duration-300"
                )}
              >
                {ICONS[link.icon]}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground">
                  {link.label}
                </span>
                <span className="text-xs text-muted/50 truncate">
                  {link.handle}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-foreground/10 group-hover:text-accent/50 transition-colors duration-300 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="socials-footer text-center mt-6 sm:mt-10 text-xs text-muted/30">
          <p>
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}
          </p>
        </div>
      </div>
    </section>
  );
}
