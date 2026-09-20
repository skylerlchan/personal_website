import Story from "@/sections/story";

/**
 * v3: a builder's montage. See src/sections/story.
 *
 * Earlier versions are one import away:
 *   v2, words alone:        import Words from "@/sections/words"
 *   v1, attractor + deck:   the registry in src/sections/index.ts
 */
export default function Home() {
  return <Story />;
}
