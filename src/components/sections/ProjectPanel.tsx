"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/constants";
import Rotating3DImage from "@/components/ui/Rotating3DImage";
import WithAILogo from "@/components/ui/WithAILogo";

interface ProjectPanelProps {
  project: Project;
  index: number;
  categoryLabel?: string;
  id?: string;
}

export default function ProjectPanel({ project, index, categoryLabel, id }: ProjectPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !panelRef.current) return;

      const panel = panelRef.current;

      // Simple entrance animation — plays once when panel enters viewport
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      tl.from(panel.querySelectorAll(".project-char"), {
        y: 60,
        opacity: 0,
        rotateX: -60,
        stagger: 0.03,
        duration: 0.7,
        ease: "power3.out",
      });

      tl.from(
        panel.querySelector(".project-description"),
        { y: 30, opacity: 0, duration: 0.5, ease: "power3.out" },
        "-=0.3"
      );

      tl.from(
        panel.querySelectorAll(".tech-pill"),
        { scale: 0, opacity: 0, stagger: 0.04, duration: 0.3, ease: "back.out(1.7)" },
        "-=0.2"
      );

      tl.from(
        panel.querySelectorAll(".project-link"),
        { y: 20, opacity: 0, stagger: 0.08, duration: 0.4, ease: "power3.out" },
        "-=0.1"
      );

      tl.from(
        panel.querySelector(".project-visual"),
        { scale: 0.9, opacity: 0, duration: 0.6, ease: "power3.out" },
        "-=0.3"
      );
    },
    { scope: panelRef }
  );

  return (
    <div
      ref={panelRef}
      id={id}
      data-project={project.slug}
      data-snap
      className="h-screen w-full flex items-center justify-center relative overflow-hidden pt-14 sm:pt-0"
    >
      {/* Background accent glow */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${project.color}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        {/* Text content */}
        <div className={cn(index % 2 === 0 ? "lg:order-1" : "lg:order-2")}>
          {/* Category + project number */}
          <span className="text-sm font-mono text-muted mb-2 lg:mb-4 block">
            {categoryLabel && (
              <span className="uppercase tracking-[0.2em] text-muted/40 mr-3">
                {categoryLabel}
              </span>
            )}
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Title with split characters */}
          <h2 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-display font-bold mb-3 lg:mb-6">
            {project.title.split(" ").map((word, wi, arr) => (
              <span key={wi} className="inline-flex">
                {word.split("").map((char, ci) => (
                  <span
                    key={`${wi}-${ci}`}
                    className="project-char inline-block"
                    style={{ willChange: "transform, opacity" }}
                  >
                    {char}
                  </span>
                ))}
                {wi < arr.length - 1 && (
                  <span className="project-char inline-block" style={{ willChange: "transform, opacity" }}>&nbsp;</span>
                )}
              </span>
            ))}
          </h2>

          {/* Description */}
          <p className="project-description text-base lg:text-lg text-muted leading-relaxed mb-4 lg:mb-8">
            {project.description}
          </p>

          {/* Tech stack */}
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="tech-pill px-3 lg:px-4 py-1 lg:py-1.5 text-xs lg:text-sm font-mono rounded-full border border-foreground/10 bg-surface text-muted"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-4 mt-4 lg:mt-8">
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="project-link text-sm text-accent hover:text-accent-light transition-colors duration-200"
              >
                View Code
              </a>
            )}
            {project.paper && (
              <a
                href={project.paper}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="project-link text-sm text-accent hover:text-accent-light transition-colors duration-200"
              >
                View Paper
              </a>
            )}
            {project.presentation && (
              <a
                href={project.presentation}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="project-link text-sm text-accent hover:text-accent-light transition-colors duration-200"
              >
                View Presentation
              </a>
            )}
          </div>
        </div>

        {/* Project Visual */}
        <div
          className={cn(
            "project-visual",
            index % 2 === 0 ? "lg:order-2" : "lg:order-1"
          )}
        >
          <div
            className="relative aspect-[21/9] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-foreground/5"
            style={{
              background: `linear-gradient(135deg, ${project.color}15, ${project.color}05)`,
            }}
          >
            {project.visual3D && project.image3D ? (
              <Rotating3DImage
                imageSrc={project.image3D}
                alt={`${project.title} 3D View`}
                rotationRange={360}
              />
            ) : project.slug === "withai-research" ? (
              <WithAILogo className="absolute inset-0 w-full h-full object-contain p-8" />
            ) : (
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
