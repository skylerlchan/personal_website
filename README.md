# Personal Website — Skyler Chan

Fast, content-driven Next.js portfolio. Server-rendered by default, tiny client islands only where needed.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## v3, one screen per thing (current)

`src/app/page.tsx` renders `src/sections/page`. The copy is plain HTML, one screen per thing he built, with facts and sentences lifted from his September 2026 resume; `public/llms.txt` carries the full resume as Markdown and the page carries JSON-LD. Behind the copy, a fixed stage holds one three.js model floating in the centre (no base), and **the scroll is the animation**: each screen of text scrolls past while the model turns a quarter, shrinks away, and the next one grows in its place, with the light behind them crossing to that build's colour. Scrubbed, not played. Nothing reacts to the pointer. Dots on the right edge show where you are.

| Screen | Colour | Model |
|---|---|---|
| Skyler Chan | warm | a Lorenz attractor, integrated live |
| Multiplier | blue | the client's cloud, the runtime in it, the data it draws on |
| Exahuman | orange | SO-ARM101 leader and follower arms, reaching slowly (analytic IK, servo model) |
| Beta Flow Browser | cyan | an editor window with a browser in its sidebar |
| BTC funding carry | green | 3.3 years of real BTC funding (`public/data/btc-funding.json`) as bars, with the equity they compound to |
| Hoverloon | violet | the craft hovering on its tether, rotors idling |
| LastCurb | red | the camera, and the one real frame it saw, on a monitor |
| Solar geoengineering | sky | a globe with its soot shell, turning |
| Elsewhere | warm | the attractor again |

- `src/components/visuals/roster/ScrollWorld.ts`: the stage, the coloured glow and fill, the scroll-scrubbed hand-off, theme sync.
- `src/components/visuals/roster/models.ts`: the models, each taking its accent colour. `Arm.ts`: the five-axis arm.
- `src/components/visuals/Stage.tsx`: the fixed canvas; feeds `scrollY / innerHeight` to the world; lazy-loads three.js after first paint.
- `src/sections/page/index.tsx`: the screens and their copy.

Copy rules: his own sentences, no em dashes, "Multiplier" never "WithAI", no valuation or AUM on a public page. Earlier versions are intact: v2 (words alone) at `src/sections/words`, v1 via the registry below.

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
