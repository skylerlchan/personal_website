import Corridor from "@/sections/corridor";

/**
 * v3: the screen. See src/sections/corridor.
 *
 * Earlier versions are one import away:
 *   v2, words alone:        import Words from "@/sections/words"
 *   v1, attractor + deck:   the registry in src/sections/index.ts
 */
export default function Home() {
  return <Corridor />;
}
