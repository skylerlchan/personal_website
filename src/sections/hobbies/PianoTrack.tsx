"use client";

import { useState } from "react";
import Image from "next/image";
import type { PianoTrack as Track } from "./data";

/**
 * YouTube facade: shows a lightweight thumbnail until clicked.
 * Saves ~500KB and a half-dozen network requests per video on first paint.
 */
export default function PianoTrack({ track }: { track: Track }) {
  const [active, setActive] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video bg-background">
        {active ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${track.youtubeId}?autoplay=1&rel=0`}
            title={track.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="absolute inset-0 group/btn"
            aria-label={`Play ${track.title} by ${track.composer}`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover/btn:scale-[1.04]"
              unoptimized
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid place-items-center w-14 h-14 rounded-full bg-background/90 text-foreground shadow-lg transition-transform group-hover/btn:scale-110">
                <span aria-hidden className="ml-1">
                  ▶
                </span>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-medium text-foreground truncate">
          {track.title}
        </div>
        <div className="text-xs text-muted truncate">{track.composer}</div>
      </div>
    </div>
  );
}
