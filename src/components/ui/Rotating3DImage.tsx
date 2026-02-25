"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Rotating3DImageProps {
  imageSrc: string;
  alt: string;
  rotationRange?: number;
}

export default function Rotating3DImage({
  imageSrc,
  alt,
  rotationRange = 360,
}: Rotating3DImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !imageWrapperRef.current) return;

      const wrapper = imageWrapperRef.current;

      // Create scroll-triggered 3D rotation
      gsap.fromTo(
        wrapper,
        {
          rotateY: 0,
        },
        {
          rotateY: rotationRange,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{
        perspective: "1000px",
      }}
    >
      <div
        ref={imageWrapperRef}
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        />
      </div>
    </div>
  );
}
