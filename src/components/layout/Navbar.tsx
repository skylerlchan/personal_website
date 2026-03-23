"use client";

import { useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Work", href: "#work" },
  { label: "Projects", href: "#project" },
  { label: "Hobbies", href: "#hobbies" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [visible, setVisible] = useState(false);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: "body",
      start: "100vh top",
      onEnter: () => setVisible(true),
      onLeaveBack: () => setVisible(false),
    });
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex",
            "backdrop-blur-xl bg-surface/70 border border-foreground/5",
            "rounded-full px-4 py-2.5 sm:px-6 sm:py-3",
            "items-center gap-4 sm:gap-6"
          )}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                const id = item.href.replace("#", "");
                const el = document.getElementById(id);
                if (!el) return;
                e.preventDefault();
                // Use instant scroll on mobile to work with scroll-snap, smooth on desktop
                const isMobile = window.matchMedia("(max-width: 1023px)").matches;
                el.scrollIntoView({
                  behavior: isMobile ? "instant" : "smooth",
                  block: "start"
                });
              }}
              className="text-xs sm:text-sm text-muted hover:text-foreground transition-colors duration-200"
              data-cursor="link"
            >
              {item.label}
            </a>
          ))}
          <ThemeToggle />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
