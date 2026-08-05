"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export const meta = { id: "fields", label: "Fields" };

/**
 * Four things, four pictures, eight words of caption. The images carry it;
 * the type only names what you are looking at.
 */
const FIELDS = [
  { word: "Climate", note: "10× cooling", src: "/images/projects/hmei/hmei.png", alt: "Stratospheric aerosol cooling model" },
  { word: "Flight", note: "19× payload", src: "/images/projects/hoverloon/hoverloon.png", alt: "Hoverloon blimp-drone hybrid" },
  { word: "Machines", note: "sim-to-real teleop", src: "/images/projects/so1/so1-main.png", alt: "SO-101 robotic arms" },
  { word: "Markets", note: "published, SSRN", src: "/images/projects/btc-funding-carry.png", alt: "Funding carry strategy equity curve" },
];

/**
 * A pinned frame where the word cross-fades and lifts while its picture swaps
 * underneath.
 *
 * The words are absolutely stacked and centred rather than laid out in flow.
 * That is the whole trick: because nothing reflows, "Climate" can hand over to
 * "Machines" without the line jumping to accommodate a different width — the
 * two states genuinely overlap mid-transition, which is what reads as morphing
 * rather than as one thing leaving and another arriving.
 *
 * Everything is driven from one rAF loop writing only transform and opacity.
 */
export default function Fields() {
  const trackRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const p = t * (FIELDS.length - 1);

      for (let i = 0; i < FIELDS.length; i++) {
        const d = p - i;                       // signed distance, in panels
        const near = Math.max(0, 1 - Math.abs(d));

        const word = wordRefs.current[i];
        if (word) {
          word.style.opacity = String(near);
          // Lift through the frame as it passes; scale settles into place.
          word.style.transform =
            `translate3d(0, ${(-d * 46).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * near).toFixed(4)})`;
        }

        const img = imgRefs.current[i];
        if (img) {
          img.style.opacity = String(near);
          img.style.transform = `scale(${(1.08 - 0.08 * near).toFixed(4)})`;
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={trackRef} id="fields" className="relative bg-[#fbfbf9]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden">
        {/* Pictures */}
        <div className="absolute inset-0">
          {FIELDS.map((f, i) => (
            <div
              key={f.word}
              ref={(el) => { imgRefs.current[i] = el; }}
              className="absolute inset-0 will-change-transform"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
              <div aria-hidden className="absolute inset-0 bg-[#fbfbf9]/55" />
            </div>
          ))}
        </div>

        {/* Words */}
        <div className="relative grid place-items-center">
          {FIELDS.map((f, i) => (
            <div
              key={f.word}
              ref={(el) => { wordRefs.current[i] = el; }}
              className="col-start-1 row-start-1 text-center will-change-transform"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <div className="text-[3.5rem] font-medium leading-none tracking-[-0.045em] text-[#0a0a0a] sm:text-[7rem] lg:text-[9rem]">
                {f.word}
              </div>
              <div className="mt-5 font-mono text-[0.625rem] uppercase tracking-[0.24em] text-[#0a0a0a]/45 sm:text-xs">
                {f.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll length. The sticky frame already occupies one viewport in
          flow, so N−1 spacers give exactly one viewport per handover. */}
      {FIELDS.slice(1).map((f) => (
        <div key={f.word} className="h-svh" />
      ))}
    </div>
  );
}
