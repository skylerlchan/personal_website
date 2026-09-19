import Bench from "@/sections/bench";

/**
 * v3 — the bench. A robot arm presents the site; see src/sections/bench.
 *
 * Earlier versions are one import away:
 *   v2, words alone:        import Words from "@/sections/words"
 *   v1, attractor + deck:   the registry in src/sections/index.ts
 */
export default function Home() {
  return <Bench />;
}
