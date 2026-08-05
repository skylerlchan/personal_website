"use client";

import { useEffect, useRef, useState } from "react";
import type { Walkthrough } from "./data";

export default function WalkthroughCard({ w }: { w: Walkthrough }) {
  const aspect = w.aspect ?? "16/9";

  if (w.kind === "video") {
    return <VideoCard w={w} aspect={aspect} />;
  }
  return <IframeCard w={w} aspect={aspect} />;
}

function VideoCard({
  w,
  aspect,
}: {
  w: Extract<Walkthrough, { kind: "video" }>;
  aspect: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        <video
          ref={ref}
          src={w.src}
          poster={w.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!inView && (
          <div className="absolute inset-0 grid place-items-center bg-background/40 text-xs font-mono text-subtle">
            ready
          </div>
        )}
      </div>
      <figcaption className="p-5 sm:p-6 border-t border-border">
        <h3 className="text-lg sm:text-xl font-medium tracking-tight">
          {w.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">{w.blurb}</p>
      </figcaption>
    </figure>
  );
}

function IframeCard({
  w,
  aspect,
}: {
  w: Extract<Walkthrough, { kind: "iframe" }>;
  aspect: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {open ? (
          <iframe
            src={w.src}
            title={w.title}
            loading="lazy"
            allow="fullscreen; clipboard-write"
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 grid place-items-center bg-surface hover:bg-surface/70 transition-colors"
          >
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium">
              <span aria-hidden>▶</span> Open interactive demo
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-5 sm:p-6 border-t border-border">
        <h3 className="text-lg sm:text-xl font-medium tracking-tight">
          {w.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">{w.blurb}</p>
      </figcaption>
    </figure>
  );
}
