/**
 * Section registry.
 *
 * To add a new section:
 *   1. Create a folder under src/sections/<slug>/
 *   2. Export a default React component from index.tsx
 *   3. Optionally export `meta` from index.tsx with { id, label }
 *   4. Add it to the array below — order = display order.
 *
 * Sections are server components by default. Add "use client" only when
 * the section needs interactivity (forms, embeds with state, etc.).
 */
import type { ComponentType } from "react";

import Hero from "./hero";
import Fields from "./fields";
import About from "./about";
import Work from "./work";
import Projects from "./projects";
import Hobbies from "./hobbies";
import Contact from "./contact";

// Walkthroughs is written and ready in ./walkthroughs, but WALKTHROUGHS is
// still empty — rendering it would ship an "Empty state" panel telling
// visitors which source file to edit. Re-add the import and the entry below
// the moment there is a real tour to show.

export type SectionDef = {
  id: string;
  label: string;
  Component: ComponentType;
};

export const sections: SectionDef[] = [
  { id: "hero", label: "Intro", Component: Hero },
  { id: "fields", label: "Fields", Component: Fields },
  { id: "about", label: "About", Component: About },
  { id: "work", label: "Work", Component: Work },
  { id: "projects", label: "Projects", Component: Projects },
  { id: "hobbies", label: "Hobbies", Component: Hobbies },
  { id: "contact", label: "Contact", Component: Contact },
];
