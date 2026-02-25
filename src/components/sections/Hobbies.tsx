"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import SplitText from "@/components/ui/SplitText";
import PianoContent from "./Piano";
import TravelAlbum from "./Travel";

export default function Hobbies() {
  const pianoSectionRef = useRef<HTMLDivElement>(null);
  const travelSectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  /* ── Piano entrance animation ── */
  useGSAP(
    () => {
      if (reducedMotion || !pianoSectionRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pianoSectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      tl.from(".hobbies-title .char", {
        y: 60,
        opacity: 0,
        rotateX: -60,
        stagger: 0.04,
        duration: 0.9,
      });

      tl.from(".piano-content", { y: 30, opacity: 0, duration: 0.6 }, "-=0.3");
    },
    { scope: pianoSectionRef }
  );

  /* ── Travel entrance animation ── */
  useGSAP(
    () => {
      if (reducedMotion || !travelSectionRef.current) return;

      gsap.from(".travel-content", {
        scrollTrigger: {
          trigger: travelSectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: travelSectionRef }
  );

  return (
    <>
      {/* Piano Section */}
      <div
        ref={pianoSectionRef}
        id="hobbies"
        data-project="piano"
        data-snap
        className="relative min-h-screen w-full flex flex-col items-center justify-center py-6 lg:py-16 px-6"
      >
        <div className="max-w-5xl w-full">
          <span className="text-sm font-mono text-muted/50 uppercase tracking-widest mb-2 lg:mb-4 block text-center">
            Beyond Code
          </span>

          <h2 className="hobbies-title mb-4 lg:mb-8 text-center">
            <SplitText
              as="span"
              className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight"
            >
              Hobbies
            </SplitText>
          </h2>

          <div className="piano-content">
            <PianoContent />
          </div>
        </div>
      </div>

      {/* Travel Section */}
      <div
        ref={travelSectionRef}
        data-project="travel"
        data-snap
        className="relative min-h-screen w-full flex flex-col items-center justify-center py-6 lg:py-16 px-6"
      >
        <div className="max-w-5xl w-full">
          <div className="travel-content">
            <TravelAlbum />
          </div>
        </div>
      </div>
    </>
  );
}
