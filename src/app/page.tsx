"use client";

import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Hobbies from "@/components/sections/Hobbies";
import Contact from "@/components/sections/Contact";
import Socials from "@/components/sections/Socials";
import GenerativeBackground from "@/components/ui/GenerativeBackground";
import ScrollProgress from "@/components/ui/ScrollProgress";
import MobileSnapScroll from "@/components/ui/MobileSnapScroll";

export default function Home() {
  return (
    <>
      <GenerativeBackground />
      <ScrollProgress />
      <MobileSnapScroll />
      <Hero />
      <Projects />
      <Hobbies />
      <Contact />
      <Socials />
    </>
  );
}
