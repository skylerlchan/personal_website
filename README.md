# Personal Website — Skyler Chan

Fast, content-driven Next.js portfolio. Server-rendered by default, tiny client islands only where needed.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## v7: a normal website, model on the side (current)

Modelled on [rachelchen.tech](https://www.rachelchen.tech/), which he sent as the reference, with the display type pushed harder after a pass through Figma's popular portfolio templates.

**One page.** A thin sticky header, then a display claim in Fraunces with a mixed roman and italic line and a record table beside it that a hiring manager reads in four seconds. Below that, **three horizontal rails**: Work, Independent projects, Outside work. Then hobbies and contact. `src/sections/home`.

**Why rails and not a grid.** Nine cards stacked vertically made the page a long scroll for something a reader wants to skim. A rail puts the strongest first, keeps the whole page under three screens, and lets someone who cares keep going right. `src/components/Rail.tsx`: native `overflow-x` with `scroll-snap-type: x mandatory`, so a flick lands on a card rather than between two and it works on a phone with no JavaScript. The arrows are a desktop affordance only, because without them a mouse user has no sign the row continues; the row also bleeds past the right gutter so the cut-off card does the same job.

**Project order is deliberate, not chronological** (`ORDER` in `src/sections/home`): the current funded lab leads, the dormant repo trails. Each card carries its own claim, sentence, dates, number and links, so there is no detail page to keep in sync.

**Which rail a card sits in is separate from what it was.** An entry's `rail` overrides its `group`: the BTC funding carry was a real job at Paragon, so it keeps its row in the record table, but the work reads as his own and the card sits with the projects.

**Cards expand on click.** `src/components/Card.tsx`. Closed, the sentence is clamped to three lines and the links are hidden, so the ellipsis is a promise there is more. Open, the sentence unclamps and the links appear through a `0fr` to `1fr` grid row. Links are deliberately not on the closed card: a row of them under every card is noise, and reserving space for a row half the entries do not have is what made the cards ragged. The wrapper carries `inert` while closed, because a zero-height grid row hides content from the eye and the mouse but leaves it in the tab order. The rail is `align-items: start`, so opening one card grows that card and not the row.

**Every card is exactly the same height**, across all three rails. Three things are needed and none of them is enough alone: the rail stretches so a row matches its tallest card, `clamp-2` / `clamp-3` stop one long sentence setting that height, and `.meta-2` gives the meta line a *fixed* two-line height. `min-height` was not enough there: a rail whose longest meta wrapped came out a line taller than a rail whose did not, so cards matched within a row but not across rows.

`/projects` redirects to `/`; the old two-page split is gone.

**The model is a drawer, not a page.** `src/components/AskDrawer.tsx`, opened by the sparkle button in the header from anywhere, closed by Escape or the scrim. That is the right relationship: the site is the work and the model is a way to interrogate it. v6 made the chat the entire home page and buried the work.

Everything the chat research produced survived the move: sources under every answer with that entry's own number linking to `/projects#id`, a Stop that aborts server side, failures that hand the question back, a stream batched to one render per frame.

### How it is put together

- `src/components/layout/Shell.tsx` wraps every page from the root layout and owns the drawer state.
- `src/content/resume.ts` is still the only source of facts. The record table reads `place` and `role`; the cards read `claim`, `org`, `when` and `stat`.
- **Project cards have no images.** Each is a deterministic CSS gradient keyed by entry id, so the grid has colour with nothing to ship, optimise or let go stale.
- Type: Fraunces for display (`.display`), Geist Mono for every label (`.label`), Geist for running text. One accent, `#e8542b`, used only to mark the current thing.
- The record table is a real `<table>` on desktop and collapses to stacked blocks under 768px, where a three-column layout puts one word per line.

### Keeping the chat from becoming someone else's free API

`src/lib/guard.ts`, four layers, in the order they actually stop abuse:

1. **Origin.** A browser always sends `Origin` or `Referer` on a same-site POST; a script usually does not. This alone removes the casual case, and it is the one that matters. Allowlist via `CHAT_ALLOWED_HOSTS`.
2. **Per-IP window**, 12 questions an hour.
3. **Daily ceiling** of 400 for the whole site, so the worst case is a known number.
4. **Shape**: 2,000 characters a question, 24 turns, `max_tokens: 1024`.

State is in memory, so on serverless it is per instance and resets on a cold start. That is weaker than Redis and still worth having, because layer 1 stops the common case. If it needs to be real, move the counters to Upstash and keep the same shape.

### The chat endpoint

`src/app/api/chat/route.ts` picks a provider by which key is present:

- `GEMINI_API_KEY` or `OPENAI_API_KEY` uses the OpenAI-compatible path. Gemini's free tier is the default; the same path serves Groq, Cerebras, OpenRouter and Together via `OPENAI_BASE_URL`.
- `ANTHROPIC_API_KEY` uses Claude through the SDK.

The free provider wins when configured, because a well-formed Anthropic key with no credit is indistinguishable from a working one until the call fails. `CHAT_PROVIDER=anthropic` forces Claude. Note `output_config.effort` is rejected by Haiku with a 400, so it is only sent to models that take it.

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
