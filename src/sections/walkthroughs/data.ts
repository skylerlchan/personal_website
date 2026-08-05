/**
 * Product walkthroughs / demo tours.
 *
 * Two embed kinds supported out of the box:
 *
 *   kind: "video"   → MP4 produced by Screen Studio (https://screen.studio).
 *                     Drop the file under /public/videos/ and reference the path.
 *                     Auto-plays muted on hover/in-view. Mobile-friendly.
 *
 *   kind: "iframe"  → Interactive demo embed (Arcade, Supademo, Storylane).
 *                     Use the embed URL exactly as the tool provides.
 *                     Loads lazily — only mounts when user clicks "Open demo".
 *
 * To add a new walkthrough: add an entry below. That's it.
 */
export type Walkthrough =
  | {
      slug: string;
      kind: "video";
      title: string;
      blurb: string;
      src: string; // /videos/foo.mp4
      poster?: string; // optional thumbnail
      aspect?: string; // e.g. "16/10", default 16/9
    }
  | {
      slug: string;
      kind: "iframe";
      title: string;
      blurb: string;
      src: string; // Arcade / Supademo embed URL
      aspect?: string;
    };

export const WALKTHROUGHS: Walkthrough[] = [
  // Example entries — replace src with real Screen Studio / Arcade URLs.
  // {
  //   slug: "withai-platform",
  //   kind: "video",
  //   title: "WithAI Platform overview",
  //   blurb: "60-second walkthrough of the analyst console.",
  //   src: "/videos/withai-platform.mp4",
  //   poster: "/images/projects/withai/poster.jpg",
  // },
  // {
  //   slug: "hoverloon-control",
  //   kind: "iframe",
  //   title: "Hoverloon control loop",
  //   blurb: "Interactive tour of the flight stack.",
  //   src: "https://demo.arcade.software/REPLACE-ME?embed",
  // },
];
