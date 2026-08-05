import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  id?: string;
  number?: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Editorial section primitive. A hairline rule sits above a masthead row
 * (numbered index + eyebrow), followed by a serif display title and a
 * standfirst description. Consistent vertical rhythm across the page.
 * Server-rendered.
 */
export default function Section({
  id,
  number,
  eyebrow,
  title,
  description,
  children,
  className,
  contentClassName,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "w-full px-6 sm:px-8 lg:px-12 py-24 sm:py-32 lg:py-40 in-view",
        className,
      )}
    >
      <div className={cn("max-w-6xl mx-auto w-full", contentClassName)}>
        {(eyebrow || title || description) && (
          <header className="mb-14 sm:mb-20">
            {(number || eyebrow) && (
              <div className="flex items-center gap-4 pt-5 border-t border-border mb-7">
                {number && (
                  <span className="text-xs font-mono tabular-nums text-subtle">
                    {number}
                  </span>
                )}
                {eyebrow && (
                  <span className="text-xs font-mono uppercase tracking-[0.22em] text-muted">
                    {eyebrow}
                  </span>
                )}
              </div>
            )}
            {title && (
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-foreground max-w-3xl leading-[1.05]">
                {title}
              </h2>
            )}
            {/* A div, not a p: descriptions may be a component that renders
                its own paragraph, and nesting <p> is invalid and breaks
                hydration. */}
            {description && (
              <div className="mt-6 text-lg sm:text-xl text-muted max-w-2xl leading-relaxed">
                {description}
              </div>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
