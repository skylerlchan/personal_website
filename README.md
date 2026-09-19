# Personal Website — Skyler Chan

Fast, content-driven Next.js portfolio. Server-rendered by default, tiny client islands only where needed.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## v3 — the ride (current)

`src/app/page.tsx` renders `src/sections/bench`: a three.js **dark ride** on a fixed canvas, with the copy as plain DOM scrolling over it. Scrolling is the ride vehicle. It rolls along a track past nine lit platforms, one per section, each a scene-scale working model of that project in its own show colour. The spotlight, platform ring, light bars and the chase lights ahead all take the scene's colour; the camera turns its head toward the platform, dwells, then glides on under an archway. Bloom, a mirror floor and dust in the beams sell the theatre.

| Scene | Set piece | What it simulates | Tap it and… |
|---|---|---|---|
| Intro | attractor | 16,000 particles integrating the Lorenz system (RK2) live | ρ swells to 50 and settles |
| Now | swarm | 180 agents orbiting a core inside a wireframe boundary | they scatter and regroup |
| Climate | globe | 5,000 stratospheric parcels injected in the tropics, carried poleward | a fresh injection |
| Flight | blimp | a tethered blimp flying laps, spring-damped altitude | a gust; rotors fight it |
| Machines | arms | SO-101 leader → follower teleop; the follower replays the leader's joints 280 ms late | hold to steer the leader |
| Markets | market | a live funding-rate tape; equity accrues the carry | a funding shock |
| Sensing | street | a kerb with cars arriving and leaving; a camera pans and locks on free bays | the nearest car pulls out |
| Piano | piano | two octaves playing a phrase, notes rising off the keys | audible (Web Audio) |
| Contact | gate | the exit ring | it pulses |

Hits count toward **found n / 9** in the masthead, which also shows each scene's live readout (ρ, parcels past 50°, funding rate, joint angles…). Drag sideways (or tilt, on Android) to look around from the vehicle.

- `src/components/visuals/arm/RideWorld.ts` — track (Catmull-Rom), platforms, show lighting, chase lights, mirror floor, bloom, the vehicle camera (per-segment dwell easing, sub-stepped spring, bank on curves, bob at speed), head-turn input, tap raycasting, telemetry, **adaptive quality**.
- `src/components/visuals/arm/sets.ts` — the nine set pieces. Each lives in its platform's frame (+Z toward the rider) and exposes `update / poke / steer? / readout`.
- `src/components/visuals/arm/Arm.ts` — the five-axis arm: analytic IK and a servo model per joint.
- `src/components/visuals/ArmScene.tsx` — lazy-loads the ride (one ~160 KB gz chunk after first paint), fades the canvas in, falls back to text-only without WebGL.

**Devices.** Phones start one quality rung down (no mirror, pixel ratio ≤ 1.5); if frames keep missing ~38 fps the world steps down again (lower DPR → lighter bloom → no post/shadows). `?q=0..3` pins a rung for checking a device by hand; `window.__ride` is exposed for poking at scenes from devtools. Sets only simulate while their platform is near the vehicle. Dark is the default theme; light mode is a white gallery of the same scenes. Earlier versions are intact: v2 (words alone) at `src/sections/words`, v1 (attractor hero + deck) via the registry below.

## Architecture (v1)

The whole site is composed from a **section registry**: each section is a self-contained folder under `src/sections/`. Add a folder, register it in one file, you're done.

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, theme bootstrap
│   ├── page.tsx            # Renders every section in registry order
│   ├── globals.css         # Design tokens + minimal CSS
│   └── api/                # Contact form, telegram status, LLM context
├── sections/
│   ├── index.ts            # ← The registry. Add new sections here.
│   ├── hero/index.tsx
│   ├── about/index.tsx
│   ├── work/{index.tsx, data.ts}
│   ├── projects/{index.tsx, data.ts}
│   ├── walkthroughs/       # Screen Studio / Arcade demos
│   │   ├── index.tsx
│   │   ├── data.ts         # ← Add demo entries here
│   │   └── WalkthroughCard.tsx
│   ├── hobbies/{index.tsx, data.ts, PianoTrack.tsx}
│   └── contact/{index.tsx, ContactForm.tsx}
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── primitives/         # Section, InViewReveal
│   └── ui/                 # ThemeToggle
└── lib/
    ├── constants.ts        # Site-wide config (name, role, email)
    └── utils.ts            # cn() helper
```

### Adding a new section

1. Create `src/sections/<slug>/index.tsx`. Default-export a React component. Wrap it in `<Section>` from `@/components/primitives/Section` for consistent rhythm.
2. (Optional) Co-locate data in `src/sections/<slug>/data.ts`.
3. Add one line to `src/sections/index.ts`:

```ts
import MyThing from "./my-thing";
// ...
{ id: "my-thing", label: "My Thing", Component: MyThing },
```

That's it. Section appears on the page and in the nav.

### Section primitive

```tsx
import Section from "@/components/primitives/Section";

export default function Foo() {
  return (
    <Section
      id="foo"
      eyebrow="Section label"
      title="Section heading"
      description="Optional subhead."
    >
      {/* your content */}
    </Section>
  );
}
```

Server-rendered. Animates in on scroll via the global `InViewReveal` observer (~40 lines of JS, zero dependencies). Respects `prefers-reduced-motion`.

### Walkthroughs (Screen Studio + Arcade)

The walkthroughs section is built for two embed types:

- **`kind: "video"`** — MP4 from [Screen Studio](https://screen.studio). The Mac app records your screen with smooth auto-zooms onto the cursor (the "professional walkthrough" look). Drop the file in `public/videos/`, reference it in `data.ts`.
- **`kind: "iframe"`** — Interactive demo embed from [Arcade](https://arcade.software), Supademo, or Storylane. Lazy-loaded — only mounts when the user clicks "Open demo".

Add a walkthrough:

```ts
// src/sections/walkthroughs/data.ts
export const WALKTHROUGHS: Walkthrough[] = [
  {
    slug: "my-product",
    kind: "video",
    title: "Product overview",
    blurb: "60-second tour of the analyst console.",
    src: "/videos/my-product.mp4",
    poster: "/images/my-product-poster.jpg",
  },
];
```

Videos auto-play muted when scrolled into view, pause when off-screen.

## Performance principles

- **Default to server components.** `"use client"` only when interactivity is genuinely needed (forms, embed toggles, theme switch, nav state).
- **No client-side animation libraries.** No GSAP, Framer Motion, Lenis. All motion is CSS keyframes + one tiny IntersectionObserver.
- **One typeface family.** Geist + Geist Mono via `next/font`, swap-loaded.
- **YouTube facade pattern.** Piano embeds show a static thumbnail until clicked — saves ~500KB and a half-dozen requests per video on first paint.
- **`next/image` everywhere** with explicit `sizes` for responsive serving.
- **No layout shift.** Aspect-ratio boxes for all media; reveal animations only affect `opacity` + `translateY` (cheap, composited).

## Theming

Light/dark via `.dark` class on `<html>`. Bootstrap script in `layout.tsx` reads `localStorage` + `prefers-color-scheme` before paint to avoid flash. `ThemeToggle` flips the class and persists.

## Environment

`.env.local`:

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Only needed for the `/api/contact` route. Form silently degrades to error message if missing.

## Deploy

```bash
pnpm build
pnpm start
```

Or push to Vercel — zero config.
