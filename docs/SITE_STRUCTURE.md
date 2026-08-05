# Personal Website — Layout Structure

A Next.js (App Router) single-page site. The page is assembled from a **section registry**: every visible block is a self-contained folder under `src/sections/`, listed once in an array that controls render order. Layout chrome (navbar, footer, theme, reveal animations) wraps that list.

## Render tree

```Mermaid
graph TD
    Layout["app/layout.tsx (RootLayout — server)<br/>fonts · metadata · JSON-LD · theme script · Analytics"]
    Page["app/page.tsx (Home — server)"]

    Layout -->|children| Page

    Page --> Navbar["components/layout/Navbar (client)"]
    Page --> Reveal["components/primitives/InViewReveal (client)<br/>scroll-reveal observer"]
    Page --> Main["&lt;main&gt;"]
    Page --> Footer["components/layout/Footer"]

    Main --> Registry["sections/index.ts<br/>sections[] — order = display order"]

    Registry --> Hero["hero"]
    Registry --> About["about"]
    Registry --> Work["work"]
    Registry --> Projects["projects"]
    Registry --> Walk["walkthroughs"]
    Registry --> Hobbies["hobbies"]
    Registry --> Contact["contact"]

    Navbar --> Theme["components/ui/ThemeToggle (client)"]
```

## How a section is built

Every section lives in `src/sections/<slug>/`, exports a default component from `index.tsx`, and renders through the shared `Section` primitive for consistent spacing/rhythm. Sections are **server components by default**; interactive pieces are split into `"use client"` child components, and static content lives in a `data.ts` file.

```Mermaid
graph LR
    subgraph Section folder
        Index["index.tsx (server)<br/>default export + meta {id,label}"]
        Data["data.ts<br/>static content"]
        Client["Client subcomponent<br/>(use client)"]
    end

    Primitive["primitives/Section.tsx<br/>eyebrow · title · description · spacing"]
    Const["lib/constants.ts<br/>SITE_CONFIG"]

    Index --> Primitive
    Index --> Data
    Index --> Client
    Index --> Const
```

### Section inventory

| Slug           | Server `index.tsx` | Data file | Client child          |
| -------------- | ------------------ | --------- | --------------------- |
| `hero`         | yes                | —         | —                     |
| `about`        | yes                | —         | —                     |
| `work`         | yes                | `data.ts` | —                     |
| `projects`     | yes                | `data.ts` | —                     |
| `walkthroughs` | yes                | `data.ts` | `WalkthroughCard.tsx` |
| `hobbies`      | yes                | `data.ts` | `PianoTrack.tsx`      |
| `contact`      | yes                | —         | `ContactForm.tsx`     |

## Directory map

```
src/
├── app/
│   ├── layout.tsx          # RootLayout: fonts, metadata, JSON-LD, theme bootstrap, Analytics
│   ├── page.tsx            # Home: Navbar + InViewReveal + <main>{sections}</main> + Footer
│   ├── globals.css
│   └── api/
│       ├── contact/route.ts        # contact form handler
│       ├── llm-context/route.ts    # machine-readable site context for LLMs
│       └── telegram-status/route.ts
├── components/
│   ├── layout/             # Navbar (client), Footer
│   ├── primitives/         # Section (server), InViewReveal (client)
│   └── ui/                 # ThemeToggle (client)
├── sections/
│   ├── index.ts            # section registry (order = display order)
│   ├── hero/  about/  work/  projects/  walkthroughs/  hobbies/  contact/
└── lib/
    ├── constants.ts        # SITE_CONFIG (name, role, url, email, socials)
    └── utils.ts            # cn() class helper
```

## Key conventions

* **One registry, one source of order** — `sections/index.ts` lists every section as `{ id, label, Component }`. `page.tsx` maps over it; reordering or adding a section is a one-line edit here. Adding a section: create `sections/<slug>/index.tsx` with a default export, then append it to the array.
* **Server-first** — sections render on the server; only forms, embeds, the theme toggle, and the scroll-reveal observer opt into `"use client"`.
* **Shared** **`Section`** **primitive** — `eyebrow / title / description` props plus uniform padding (`max-w-6xl`, responsive `py`), and the `.in-view` hook that `InViewReveal` animates on scroll.
* **Theme** — set before paint by an inline script in `layout.tsx` (reads `localStorage` / `prefers-color-scheme`), toggled at runtime by `ThemeToggle`.
* **Config-driven identity** — name, role, email, and social links come from `SITE_CONFIG` in `lib/constants.ts`, consumed by metadata, JSON-LD, the hero, and the contact section.

```
```

