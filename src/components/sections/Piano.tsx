"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { PIANO_VIDEOS } from "@/lib/constants";

/* ── YouTube IFrame Player types ── */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  loadVideoById(id: string): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: Record<string, unknown>
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/* ── Icons ── */
const ShuffleIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-muted/50"}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

const RepeatIcon = ({ mode }: { mode: RepeatMode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={mode !== "off" ? "text-accent" : "text-muted/50"}>
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
    {mode === "one" && <text x="9" y="15" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>}
  </svg>
);

const SkipIcon = ({ direction }: { direction: "prev" | "next" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
    {direction === "prev" ? (
      <>
        <path d="M6 6h2v12H6z" />
        <path d="M18 6l-8 6 8 6z" />
      </>
    ) : (
      <>
        <path d="M16 6h2v12h-2z" />
        <path d="M6 6l8 6-8 6z" />
      </>
    )}
  </svg>
);

type RepeatMode = "off" | "all" | "one";

export default function PianoContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [history, setHistory] = useState<number[]>([0]);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerElRef = useRef<HTMLDivElement>(null);
  const playNextRef = useRef<() => void>(() => {});
  const skipInitialLoad = useRef(true);

  const current = PIANO_VIDEOS[activeIndex];

  /* ── Load YouTube IFrame API script ── */
  useEffect(() => {
    if (window.YT?.Player) return;
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }, []);

  /* ── Create player once API is ready ── */
  useEffect(() => {
    let cancelled = false;

    const create = () => {
      if (cancelled || playerRef.current || !playerElRef.current) return;
      playerRef.current = new window.YT!.Player(playerElRef.current, {
        videoId: PIANO_VIDEOS[0].youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          rel: 0,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) {
              setPlayerReady(true);
              setPlaying(true);
            }
          },
          onStateChange: (e: { data: number }) => {
            if (cancelled) return;
            // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3
            if (e.data === 0) playNextRef.current();
            setPlaying(e.data === 1 || e.data === 3);
          },
        },
      } as Record<string, unknown>);
    };

    if (window.YT?.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        create();
      };
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, []);

  /* ── Navigation helpers ── */
  const getRandomIndex = useCallback((exclude: number) => {
    if (PIANO_VIDEOS.length <= 1) return 0;
    let n: number;
    do {
      n = Math.floor(Math.random() * PIANO_VIDEOS.length);
    } while (n === exclude);
    return n;
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    setHistory((h) => [...h, index]);
  }, []);

  const playNext = useCallback(() => {
    if (repeat === "one") {
      playerRef.current?.loadVideoById(PIANO_VIDEOS[activeIndex].youtubeId);
      return;
    }
    if (shuffle) {
      goTo(getRandomIndex(activeIndex));
    } else {
      const next = activeIndex + 1;
      if (next < PIANO_VIDEOS.length) goTo(next);
      else if (repeat === "all") goTo(0);
    }
  }, [activeIndex, shuffle, repeat, goTo, getRandomIndex]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrev = useCallback(() => {
    if (shuffle && history.length > 1) {
      const h = [...history];
      h.pop();
      setActiveIndex(h[h.length - 1]);
      setHistory(h);
    } else {
      const prev = activeIndex - 1;
      if (prev >= 0) goTo(prev);
      else if (repeat === "all") goTo(PIANO_VIDEOS.length - 1);
    }
  }, [activeIndex, shuffle, repeat, history, goTo]);

  const cycleRepeat = useCallback(() => {
    setRepeat((p) => (p === "off" ? "all" : p === "all" ? "one" : "off"));
  }, []);

  /* ── Load new video when track changes (skip initial mount) ── */
  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    if (!playerRef.current || !playerReady) return;
    playerRef.current.loadVideoById(current.youtubeId);
  }, [activeIndex, playerReady, current.youtubeId]);

  /* ── Playback controls ── */
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [playing]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }, [muted]);

  return (
    <div
      className={cn(
        "piano-player rounded-2xl overflow-hidden",
        "border border-foreground/[0.06] bg-surface/60 backdrop-blur-md"
      )}
    >
      {/* Video + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        {/* Video area */}
        <div className="relative aspect-video max-h-[28dvh] sm:max-h-[35dvh] lg:max-h-none bg-black">
          <div className="absolute inset-0 [&>iframe]:!w-full [&>iframe]:!h-full">
            <div ref={playerElRef} />
          </div>

          {/* Mobile-only mute overlay — bottom-right of video */}
          {muted && playerReady && (
            <button
              onClick={toggleMute}
              data-cursor="link"
              className={cn(
                "absolute bottom-3 right-3 z-10 sm:hidden",
                "flex items-center gap-1.5 px-2.5 py-1.5",
                "bg-black/60 backdrop-blur-sm rounded-full",
                "hover:bg-black/70 active:scale-95",
                "transition-all duration-200 cursor-pointer",
                "animate-[fadeSlideIn_0.5s_ease-out]"
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white shrink-0"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span className="text-xs font-medium text-white whitespace-nowrap">
                Tap to unmute
              </span>
            </button>
          )}
        </div>

        {/* Track list sidebar */}
        <div className="border-l border-foreground/[0.06] flex flex-col">
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-foreground/[0.06]">
            <p className="text-xs font-mono text-muted/50 uppercase tracking-wider">
              Repertoire
            </p>
          </div>

          {/* Tracks — data-lenis-prevent fixes scroll capture */}
          <div
            className="piano-tracklist flex-1 overflow-y-auto max-h-[120px] sm:max-h-[180px] lg:max-h-[340px]"
            data-lenis-prevent
          >
            {PIANO_VIDEOS.map((video, i) => (
              <button
                key={video.id}
                onClick={() => goTo(i)}
                data-cursor="link"
                className={cn(
                  "group w-full flex items-center gap-3 px-4 py-2.5 text-left",
                  "transition-all duration-150 cursor-pointer",
                  i === activeIndex
                    ? "bg-accent/8"
                    : "hover:bg-foreground/[0.03]"
                )}
              >
                {/* Number or equalizer */}
                <div className="w-5 shrink-0 flex justify-center">
                  {i === activeIndex ? (
                    <div className="flex items-end gap-[2px] h-3">
                      <span
                        className="w-[3px] bg-accent rounded-full"
                        style={{
                          height: "60%",
                          animation: playing
                            ? "eq 0.6s ease-in-out infinite alternate"
                            : "none",
                          opacity: playing ? 1 : 0.5,
                        }}
                      />
                      <span
                        className="w-[3px] bg-accent rounded-full"
                        style={{
                          height: "100%",
                          animation: playing
                            ? "eq 0.6s ease-in-out infinite alternate 0.2s"
                            : "none",
                          opacity: playing ? 1 : 0.5,
                        }}
                      />
                      <span
                        className="w-[3px] bg-accent rounded-full"
                        style={{
                          height: "40%",
                          animation: playing
                            ? "eq 0.6s ease-in-out infinite alternate 0.4s"
                            : "none",
                          opacity: playing ? 1 : 0.5,
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-muted/30 group-hover:hidden">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  {i !== activeIndex && (
                    <svg
                      className="w-3 h-3 text-foreground hidden group-hover:block"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] font-medium truncate leading-tight",
                      i === activeIndex
                        ? "text-accent"
                        : "text-foreground/80 group-hover:text-foreground"
                    )}
                  >
                    {video.title}
                  </p>
                  <p className="text-[11px] text-muted/40 truncate">
                    {video.composer}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transport bar */}
      <div className="border-t border-foreground/[0.06] px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-0">
        {/* Now playing info — left (hidden on very small screens to save space) */}
        <div className="hidden sm:block flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {current.title}
          </p>
          <p className="text-xs text-muted/50 truncate">{current.composer}</p>
        </div>

        {/* Controls — centered */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShuffle((s) => !s)}
            data-cursor="link"
            aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
            className={cn(
              "p-1.5 rounded-full transition-colors duration-200 cursor-pointer hover:bg-foreground/5",
              shuffle && "relative"
            )}
          >
            <ShuffleIcon active={shuffle} />
            {shuffle && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </button>

          <button
            onClick={playPrev}
            data-cursor="link"
            aria-label="Previous track"
            className="p-1.5 rounded-full hover:bg-foreground/5 transition-colors duration-200 cursor-pointer"
          >
            <SkipIcon direction="prev" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            data-cursor="link"
            aria-label={playing ? "Pause" : "Play"}
            className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors duration-200 cursor-pointer"
          >
            {playing ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-foreground"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-foreground"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={playNext}
            data-cursor="link"
            aria-label="Next track"
            className="p-1.5 rounded-full hover:bg-foreground/5 transition-colors duration-200 cursor-pointer"
          >
            <SkipIcon direction="next" />
          </button>

          <button
            onClick={cycleRepeat}
            data-cursor="link"
            aria-label={`Repeat: ${repeat}`}
            className={cn(
              "p-1.5 rounded-full transition-colors duration-200 cursor-pointer hover:bg-foreground/5",
              repeat !== "off" && "relative"
            )}
          >
            <RepeatIcon mode={repeat} />
            {repeat !== "off" && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* Unmute — right (hidden on mobile, shown on sm+) */}
        <div className="flex-1 min-w-0 hidden sm:flex justify-end">
          {muted && playerReady && (
            <button
              onClick={toggleMute}
              data-cursor="link"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5",
                "bg-foreground/10 rounded-full",
                "hover:bg-foreground/15 active:scale-95",
                "transition-all duration-200 cursor-pointer",
                "animate-[fadeSlideIn_0.5s_ease-out]"
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground shrink-0"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                Tap to unmute
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}