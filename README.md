# Personal Website — Skyler Chan

Fast, content-driven Next.js portfolio. Server-rendered by default, tiny client islands only where needed.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## v3, the corridor (current)

`src/app/page.tsx` renders `src/sections/corridor`: one straight black hall in three.js. The words are the objects. Each station is a few standing words set in Geist (drawn to a canvas, stretched over a subdivided plane so a vertex shader can run one slow ripple through them), a number painted on the floor before the words (perspective warps it as you pass over), and the machine it refers to, at rest under one pool of light. Scrolling is a slow dolly forward. The whole view is seen through a faint lens: a little barrel warp, a hair of colour fringing, a vignette. Nothing else moves faster than a breath.

| Station | Floor | Machine, at rest |
|---|---|---|
| 2023 · BTC funding carry | 16.0% | the real funding series (`public/data/btc-funding.json`, 3.3 yrs) as bars, with the equity it compounds to |
| 2024 · LastCurb | 4 / 4 | the camera, and the one real frame it saw, on a monitor |
| 2024–25 · Stratospheric black carbon | 10× | a globe with its soot shell, turning once every long while |
| 2024–25 · Hoverloon | 19× | the craft hovering on its tether, rotors idling |
| 2025 · SO-101 teleop | 280 ms | leader and follower holding the same slow pose |
| 2026 · Multiplier | $208K | the client's cloud, the runtime in it, the data it draws on |

- `src/components/visuals/corridor/text.ts`: words as meshes, from the page's own fonts (`--font-geist`, `--font-geist-mono`), with the ripple shader.
- `src/components/visuals/corridor/CorridorWorld.ts`: hall, mirror floor, grid, lens pass, the dolly, station layout per orientation, distance fades, **adaptive quality** (`?q=0..3` pins a rung; `window.__hall` for devtools).
- `src/components/visuals/corridor/props.ts`: the machines. `Arm.ts`: the five-axis arm (analytic IK, servo model).
- `src/sections/corridor/index.tsx`: scroll length, the same words for screen readers, and the links, pinned to the bottom edge.
- `src/components/visuals/CorridorScene.tsx`: lazy-loads the world after first paint; text-only without WebGL.

Phones start one quality rung down (no mirror, DPR ≤ 1.5) and step down further if frames miss ~38 fps. Earlier versions are intact: v2 (words alone) at `src/sections/words`, v1 via the registry below.

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
