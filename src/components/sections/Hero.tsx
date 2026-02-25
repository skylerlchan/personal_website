"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import SplitText from "@/components/ui/SplitText";
import GrainOverlay from "@/components/ui/GrainOverlay";
import { SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Stagger in name characters
      tl.from(".hero-name .char", {
        y: 100,
        opacity: 0,
        rotateX: -80,
        stagger: 0.04,
        duration: 1,
      });

      // Fade in title
      tl.from(
        ".hero-title .char",
        {
          y: 40,
          opacity: 0,
          stagger: 0.02,
          duration: 0.8,
        },
        "-=0.5"
      );

      // Fade in description
      tl.from(
        ".hero-description",
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
        },
        "-=0.4"
      );

      // Scroll indicator entrance
      tl.from(
        scrollIndicatorRef.current,
        {
          opacity: 0,
          y: -10,
          duration: 0.6,
        },
        "-=0.2"
      );

      // Desktop: bobbing arrow below mouse
      gsap.to(".scroll-arrow-desktop", {
        y: 8,
        duration: 1.2,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Desktop: mouse wheel animation
      gsap.to(".scroll-wheel", {
        y: 6,
        opacity: 0,
        duration: 1,
        ease: "power1.in",
        repeat: -1,
        repeatDelay: 0.4,
      });

      // Mobile: swipe-up chevron slides up and fades
      gsap.to(".swipe-chevron", {
        y: -8,
        opacity: 0,
        duration: 1,
        ease: "power1.in",
        repeat: -1,
        repeatDelay: 0.6,
      });

      // Fade out scroll indicator as user starts scrolling
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "15% top",
        scrub: true,
        onUpdate: (self) => {
          if (scrollIndicatorRef.current) {
            gsap.set(scrollIndicatorRef.current, {
              opacity: 1 - self.progress * 3,
            });
          }
        },
      });

      // Parallax on scroll
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          if (nameRef.current) {
            gsap.set(nameRef.current, { y: self.progress * 100 });
          }
          if (titleRef.current) {
            gsap.set(titleRef.current, { y: self.progress * 60 });
          }
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-snap
      className={cn(
        "relative h-screen w-full flex flex-col items-center justify-center",
        "overflow-hidden px-6"
      )}
    >
      <GrainOverlay />

      <div className="relative z-10 text-center max-w-4xl">
        <h1 ref={nameRef} className="hero-name mb-4">
          <SplitText
            as="span"
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight"
          >
            {SITE_CONFIG.name}
          </SplitText>
        </h1>

        <p ref={titleRef} className="hero-title mb-6">
          <SplitText
            as="span"
            className="text-xl sm:text-2xl md:text-3xl text-muted font-light tracking-wide"
          >
            {SITE_CONFIG.title}
          </SplitText>
        </p>

        <p className="hero-description text-lg sm:text-xl md:text-2xl text-muted/60 font-medium tracking-wide max-w-xl mx-auto">
          <span className="block sm:inline whitespace-nowrap">Always building.</span>{" "}
          <span className="block sm:inline whitespace-nowrap">Always thinking.</span>
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
      >
        {/* Desktop: mouse + down chevron */}
        <div className="hidden sm:flex flex-col items-center gap-3">
          <div className="w-6 h-10 rounded-full border-2 border-muted/40 flex justify-center pt-2">
            <div className="scroll-wheel w-1 h-2 rounded-full bg-muted/60" />
          </div>
          <svg
            className="scroll-arrow-desktop w-4 h-4 text-muted/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Mobile: swipe up indicator */}
        <div className="flex sm:hidden flex-col items-center gap-2">
          <svg
            className="swipe-chevron w-5 h-5 text-muted/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40 font-medium">
            Swipe up
          </span>
        </div>
      </div>
    </section>
  );
}
