# What Makes a Great Mobile Personal Website

*Research compiled 2026-06-05. Focus: developer/portfolio personal sites on mobile. Evidence-based; current to 2025–2026 standards. Sources cited inline.*

Mobile is the default case, not the exception — and for a personal site it's where most first impressions actually happen (a recruiter tapping a link from LinkedIn, someone scanning your site between meetings). The bar is: it loads fast, reads cleanly held at arm's length, responds instantly to a thumb, and makes the one thing you want (contact / hire / view work) obvious. Everything below is in service of that.

---

## 1. Performance — the foundation everything else sits on

Mobile performance is the single highest-leverage thing, because a beautiful hero means nothing if the visitor leaves before it renders ([Perfect Afternoon](https://www.perfectafternoon.com/2025/hero-section-design/)).

**Hit the Core Web Vitals "good" thresholds (measured at the 75th percentile of real users):**

| Metric | "Good" | Measures |
|--------|--------|----------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5 s | Loading — when the biggest element paints |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | Responsiveness — tap-to-feedback latency |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | Visual stability — content jumping around |

These thresholds are identical for mobile and desktop, but mobile is much harder to pass: per the 2025 Web Almanac, only **48% of mobile pages** pass all three (vs 56% desktop), and LCP is the hardest single metric — only 62% of mobile pages clear it ([corewebvitals.io](https://www.corewebvitals.io/core-web-vitals), [web.dev](https://web.dev/articles/vitals)). INP replaced FID as a Core Web Vital in March 2024, so responsiveness to taps is now formally part of the score.

**Set a JavaScript / page-weight budget and enforce it.** Rough 2025 targets: marketing/personal pages under **~400–500 KB total**, with **JS capped near ~200 KB compressed**; content-heavy sites can stretch to ~750 KB on mobile ([Galaxy Blog](https://blog.galaxycloud.app/performance-and-optimization-client-side-bundle-size-optimization/)). Wire a budget into CI (e.g. the `size-limit` library) so regressions get caught automatically ([DEV: Reduce JS Bundle](https://dev.to/frontendtoolstech/how-to-reduce-javascript-bundle-size-in-2025-2n77)). Smaller bundles directly improve Time to Interactive and INP, and mobile users — often on slower CPUs and networks — benefit most ([Medium: Optimizing JS for Mobile](https://medium.com/@schaman762/optimizing-javascript-for-mobile-best-practices-for-faster-web-apps-6f4cc6e03412)).

**Techniques that move the needle:**
- **Code-split & lazy-load** — ship only what the current view needs; defer below-the-fold JS ([Catch Metrics](https://www.catchmetrics.io/blog/optimizing-nextjs-performance-bundles-lazy-loading-and-images)).
- **Modern image formats (AVIF/WebP)** + responsive `srcset`/`<picture>`; they beat JPEG/PNG on quality-per-byte ([Request Metrics](https://requestmetrics.com/web-performance/high-performance-images/)).
- **Lazy-load below-the-fold images** with `loading="lazy"`, but *priority-load* the hero image so it doesn't hurt LCP. Note: `loading="lazy"` alone doesn't fix oversized or wrong-format images — pair it with real optimization ([Cloudinary](https://cloudinary.com/guides/web-performance/react-lazy-loading-images)).
- **Reserve space for images/embeds** (width/height or aspect-ratio) to keep CLS near zero — the most common CLS cause is media loading without reserved dimensions.

> *Applies to your stack:* Next.js's `<Image>` component is explicitly called out as the modern best-practice baseline — automatic format selection, lazy loading, blur placeholders, responsive sizing, and `priority` for above-the-fold images to prevent layout shift ([Catch Metrics](https://www.catchmetrics.io/blog/optimizing-nextjs-performance-bundles-lazy-loading-and-images)). Your site already uses `next/image` and a server-first component model, both of which are aligned.

---

## 2. Layout & navigation — built for thumbs

**Design mobile-first, then enhance up.** Smaller screens force you to prioritize the critical content; skipping mobile testing is a top cause of cut-off, misaligned, hard-to-tap layouts and elevated bounce ([Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/)).

**Respect the thumb zone.** ~49% of users navigate one-handed with their thumb, making the **bottom third of the screen** (bottom-right for righties) the most reachable area. Put frequent actions there ([Webstacks](https://www.webstacks.com/blog/mobile-menu-design)).

**Navigation pattern:**
- For a **3–5 section** personal site, a **bottom tab bar** is the mobile gold standard — primary sections one tap away, within thumb reach ([Navbar Gallery](https://www.navbar.gallery/blog/best-mobile-navigation-bar-designs)).
- **Hamburger menus** maximize flexibility but hide everything by default: *"If your navigation is hidden in a hamburger menu, it doesn't exist."* Anything conversion-critical shouldn't live only behind the hamburger ([Webstacks](https://www.webstacks.com/blog/mobile-menu-design), [The Crit](https://thecrit.co/resources/portfolio-navigation-best-practices)).
- **Best of both:** a hamburger for the full section list *plus* a persistent, always-visible CTA (e.g. "Contact" / "Email me") so the key action is never hidden ([Webstacks](https://www.webstacks.com/blog/mobile-menu-design)).

> *Applies to your stack:* you have 7 sections (hero, about, work, projects, walkthroughs, hobbies, contact) — past the 3–5 sweet spot for a pure bottom bar. A hamburger for full nav + a persistent visible "Contact" affordance is the better fit. Make sure the navbar's tap targets meet the sizes in §4.

---

## 3. The hero / above-the-fold — pass the 5-second test

The hero has one job on mobile: in **under 3 seconds**, a stranger should know *who you are, what you do,* and *what to do next* ([Buzz Web Media](https://buzzwebmedia.com.au/maximise-hero-section/)).

- **The 5-second test:** show your hero to someone unfamiliar for 5 seconds; if they can't say what you do *and* the next action, simplify ([Nudge](https://www.nudgenow.com/blogs/web-design-hero-section-best-practices)).
- **Keep copy short:** headline 5–8 words; subhead 15–20. Heroes under ~40 total words outperform long copy blocks ([Nudge](https://www.nudgenow.com/blogs/web-design-hero-section-best-practices)).
- **One primary CTA.** Multiple competing CTAs cause decision paralysis — conflicting CTAs can cut conversion by up to **266%**; "when users have too much to choose from, they often choose nothing" ([Buzz Web Media](https://buzzwebmedia.com.au/maximise-hero-section/), [Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/)).
- **Put the CTA above the fold.** Burying it lower measurably reduces interaction ([Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/)).
- **Skip generic stock photos** — they weaken trust. Use real work, real you ([Memorable](https://memorable.design/hero-section-examples/)).

---

## 4. Touch targets & typography — readable and tappable at arm's length

**Touch targets:**
- **WCAG 2.2 Level AA (2.5.8)** requires interactive targets of at least **24×24 CSS px**, or 24px of spacing between smaller targets ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- That's the floor. **Apple HIG recommends 44×44 pt**, **Google Material recommends 48×48 dp** — both align with the stricter WCAG 2.5.5 (AAA) **44×44** guidance and are the practical targets to design to ([TestParty](https://testparty.ai/blog/wcag-target-size-guide)).
- Adequate size *and spacing* prevents accidental taps on neighboring controls — critical for users with motor/dexterity limitations ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).

**Typography:**
- **Body text ≥ 16px** on mobile. It's the browser default, what Google's mobile-friendly guidance recommends, and the point below which Lighthouse/PageSpeed flag "text too small" ([greadme](https://www.greadme.com/blog/seo/best-font-sizes-for-readability-complete-guide)).
- At typical phone reading distance (25–35 cm), 16px is the *lower* edge of comfort — **18–20px often improves long-form readability with no downside** ([fontfyi](https://fontfyi.com/blog/mobile-typography-accessibility/), [greadme](https://www.greadme.com/blog/seo/best-font-sizes-for-readability-complete-guide)).
- **Line-height 1.4–1.6**; line length **50–75 characters** ([greadme](https://www.greadme.com/blog/seo/best-font-sizes-for-readability-complete-guide)).
- **Headings 1.3–1.6×** body size for clear hierarchy ([OneNine](https://onenine.com/10-mobile-typography-tips-for-better-readability/)).
- **Contrast: 4.5:1** for normal text, **3:1** for large text (WCAG AA) ([DeveloperUX](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/)).

---

## 5. Motion & scroll animation — tasteful, and always reduced on request

Scroll-reveal and parallax are popular on personal sites, but on mobile they're easy to overdo and can actively harm some users.

- **Honor `prefers-reduced-motion`.** Moving/parallax/sliding content can trigger vertigo, nausea, and migraines for people with vestibular disorders, and distracts users with ADHD ([Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)). This maps to WCAG 2.3.3.
- **The intent is *reduce*, not *kill all motion*.** Strip non-essential decorative motion (fades, slides, parallax, hover transitions); keep motion that conveys essential meaning ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
- **Implementation:** wrap CSS animations / smooth-scroll in `@media (prefers-reduced-motion: no-preference)` so reduced-motion users get instant behavior by default; for JS-driven motion, check `window.matchMedia('(prefers-reduced-motion: reduce)')` and fall back to `behavior: 'auto'` ([CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
- Keep reveal animations short and subtle — they should never delay the user reaching content, and they must not cause CLS.

> *Applies to your stack:* your `InViewReveal` scroll-reveal observer is exactly the kind of decorative motion that should be gated behind `prefers-reduced-motion: no-preference`. Worth verifying it degrades to "content simply visible" when reduced motion is on.

---

## 6. Dark mode — if you offer it, do it right

Dark mode is now an expectation, but a careless implementation is worse than none.

- **Don't use pure black (#000) backgrounds.** Use dark grays like **#121212 / #1C1C1C**. Pure black + bright text causes halation and visual "vibration," especially for users with astigmatism ([Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)).
- **Don't use pure white (#FFF) body text.** Use a slightly muted near-white (e.g. #E0E0E0) to cut harshness while keeping contrast ([Raw.Studio](https://raw.studio/blog/designing-inclusive-dark-modes-enhancing-accessibility-and-user-experience/)).
- **Keep ≥4.5:1 contrast** for body text, 3:1 for large/UI ([Accessibility Checker](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/)).
- **Re-tune accent colors** for the dark background — saturated greens/reds/yellows often need luminance adjustment so they don't glow ([Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)).
- **Respect the system preference** and avoid a flash of the wrong theme on load.

> *Applies to your stack:* you already do the right thing on the flash issue — an inline pre-paint script in `layout.tsx` reads `localStorage`/`prefers-color-scheme` before render. Worth auditing the actual palette in `globals.css` against the not-pure-black / not-pure-white / 4.5:1 rules above.

---

## 7. Accessibility — baked in, not bolted on

Most of the items above *are* accessibility (target size, contrast, reduced motion, 16px text). The rest of the baseline:

- **Semantic HTML & landmarks** (`<main>`, `<nav>`, `<header>`, real `<h1>`–`<h2>` hierarchy) so screen readers and SEO both parse the page.
- **Visible focus states** and full keyboard operability (some "mobile" users use external keyboards / switch devices).
- **Alt text** on every meaningful image; empty alt on decorative ones.
- **Don't disable zoom** (`user-scalable=no` is an anti-pattern) — let users pinch to enlarge.
- **Test under real conditions** — multiple devices, lighting, and the reduced-motion / dark settings actually toggled ([Muksalcreative](https://muksalcreative.com/2025/07/26/dark-mode-design-best-practices-2025/)).

---

## 8. Contact & conversion — make the ask effortless

A personal site usually has one goal: get the visitor to reach out or view your work. On mobile, reduce every gram of friction.

- **One clear primary action**, repeated where natural (hero + contact section), never competing with rival CTAs ([Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/)).
- **Tap-to-act links:** `mailto:`, `tel:`, and direct social links remove typing — ideal for thumbs. (Your contact section already does this.)
- **Keep forms short.** Every extra field costs completions on mobile; ask only for what you need.
- **Make the CTA reachable in the thumb zone** and ensure its tap target meets §4 sizing.

---

## The short version — a mobile checklist

1. **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1** at p75 — treat as pass/fail.
2. **Budget the page:** ~≤400–500 KB, JS ≤ ~200 KB compressed; enforce in CI.
3. **Optimized, responsive AVIF/WebP** images; priority-load the hero, lazy-load the rest, reserve dimensions.
4. **Hero passes the 5-second test:** ≤40 words, one CTA, above the fold, real imagery.
5. **Nav for thumbs:** don't hide the key action behind a hamburger; keep a persistent Contact affordance.
6. **Touch targets 44–48px** (24px is the absolute WCAG floor).
7. **Body text ≥16px (18–20 better), line-height 1.4–1.6, 4.5:1 contrast.**
8. **`prefers-reduced-motion` honored** — gate all decorative scroll/parallax motion.
9. **Dark mode:** #121212-ish bg, ~#E0E0E0 text, never pure black/white; no theme flash.
10. **Semantic HTML, visible focus, alt text, pinch-zoom enabled.**

---

## Common mistakes to avoid

- Designing desktop-first and shrinking down; skipping real mobile testing → cut-off, mis-tapped layouts and higher bounce ([Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/)).
- A heavy hero image/video that tanks LCP and first impression ([Perfect Afternoon](https://www.perfectafternoon.com/2025/hero-section-design/)).
- Multiple competing CTAs (up to −266% conversion) ([Buzz Web Media](https://buzzwebmedia.com.au/maximise-hero-section/)).
- Hiding the primary action behind a hamburger ([Webstacks](https://www.webstacks.com/blog/mobile-menu-design)).
- Tap targets too small or too close together ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- Body text under 16px ([greadme](https://www.greadme.com/blog/seo/best-font-sizes-for-readability-complete-guide)).
- Parallax/scroll motion with no reduced-motion fallback ([Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)).
- Pure-black bg + pure-white text in dark mode ([Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)).
- Generic stock photography ([Memorable](https://memorable.design/hero-section-examples/)).
- `loading="lazy"` treated as a substitute for actually optimizing images ([Cloudinary](https://cloudinary.com/guides/web-performance/react-lazy-loading-images)).

---

## Sources

- Google / web.dev — [Web Vitals](https://web.dev/articles/vitals), [Core Web Vitals report](https://support.google.com/webmasters/answer/9205520?hl=en), [corewebvitals.io](https://www.corewebvitals.io/core-web-vitals)
- W3C WAI — [WCAG 2.2 SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [TestParty target-size guide](https://testparty.ai/blog/wcag-target-size-guide)
- Typography — [greadme font-size guide](https://www.greadme.com/blog/seo/best-font-sizes-for-readability-complete-guide), [DeveloperUX](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/), [OneNine](https://onenine.com/10-mobile-typography-tips-for-better-readability/), [fontfyi](https://fontfyi.com/blog/mobile-typography-accessibility/)
- Navigation — [Webstacks](https://www.webstacks.com/blog/mobile-menu-design), [Navbar Gallery](https://www.navbar.gallery/blog/best-mobile-navigation-bar-designs), [The Crit](https://thecrit.co/resources/portfolio-navigation-best-practices)
- Hero / conversion — [Omniconvert](https://www.omniconvert.com/blog/above-the-fold-design/), [Nudge](https://www.nudgenow.com/blogs/web-design-hero-section-best-practices), [Buzz Web Media](https://buzzwebmedia.com.au/maximise-hero-section/), [Perfect Afternoon](https://www.perfectafternoon.com/2025/hero-section-design/), [Memorable](https://memorable.design/hero-section-examples/)
- Performance — [Catch Metrics (Next.js)](https://www.catchmetrics.io/blog/optimizing-nextjs-performance-bundles-lazy-loading-and-images), [Galaxy Blog (budgets)](https://blog.galaxycloud.app/performance-and-optimization-client-side-bundle-size-optimization/), [DEV: Reduce JS bundle](https://dev.to/frontendtoolstech/how-to-reduce-javascript-bundle-size-in-2025-2n77), [Request Metrics (images)](https://requestmetrics.com/web-performance/high-performance-images/), [Cloudinary (lazy loading)](https://cloudinary.com/guides/web-performance/react-lazy-loading-images)
- Motion — [Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/), [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/)
- Dark mode — [Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/), [Raw.Studio](https://raw.studio/blog/designing-inclusive-dark-modes-enhancing-accessibility-and-user-experience/), [Accessibility Checker](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/), [Muksalcreative](https://muksalcreative.com/2025/07/26/dark-mode-design-best-practices-2025/)
