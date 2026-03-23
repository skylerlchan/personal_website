"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

const SplitText = forwardRef<HTMLElement, SplitTextProps>(
  ({ children, className, as: Tag = "span" }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
        className={cn("inline", className)}
        aria-label={children}
      >
        {children.split(" ").map((word, wi, words) => (
          <span key={wi} className="inline-block whitespace-nowrap" aria-hidden="true">
            {word.split("").map((char, ci) => (
              <span
                key={ci}
                className="char inline-block"
                aria-hidden="true"
                style={{ willChange: "transform, opacity" }}
              >
                {char}
              </span>
            ))}
            {wi < words.length - 1 && (
              <span
                className="char inline-block"
                aria-hidden="true"
                style={{ willChange: "transform, opacity" }}
              >
                {"\u00A0"}
              </span>
            )}
          </span>
        ))}
      </Tag>
    );
  }
);

SplitText.displayName = "SplitText";

export default SplitText;
