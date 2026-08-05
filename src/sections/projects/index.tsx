import Section from "@/components/primitives/Section";
import ProjectDeck from "./ProjectDeck";
import { PROJECTS } from "./data";

export const meta = { id: "projects", label: "Projects" };

export default function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Things I've built"
      description="Personal and research projects, from edge AI to climate models."
    >
      <ProjectDeck items={PROJECTS} />
    </Section>
  );
}
