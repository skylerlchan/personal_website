"use client";

import ProjectPanel from "./ProjectPanel";
import { PROJECTS } from "@/lib/constants";

const work = PROJECTS.filter((p) => p.category === "work");
const projects = PROJECTS.filter((p) => p.category === "project");

export default function Projects() {
  return (
    <section>
      {work.map((project, i) => (
        <ProjectPanel
          key={project.slug}
          project={project}
          index={i}
          categoryLabel={i === 0 ? "Work" : undefined}
          id={i === 0 ? "work" : undefined}
        />
      ))}
      {projects.map((project, i) => (
        <ProjectPanel
          key={project.slug}
          project={project}
          index={work.length + i}
          categoryLabel={i === 0 ? "Projects" : undefined}
          id={i === 0 ? "project" : undefined}
        />
      ))}
    </section>
  );
}
