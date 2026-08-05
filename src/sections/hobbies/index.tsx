import Image from "next/image";
import Section from "@/components/primitives/Section";
import { PIANO, FOOD_PHOTOS } from "./data";
import PianoTrack from "./PianoTrack";

export const meta = { id: "hobbies", label: "Hobbies" };

export default function Hobbies() {
  return (
    <Section
      id="hobbies"
      eyebrow="Beyond code"
      title="Piano and places"
      description="Classical and jazz piano. Eating my way through cities."
    >
      {/* Piano */}
      <div className="mb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-xl sm:text-2xl font-medium tracking-tight">
            Recent recordings
          </h3>
          <span className="text-xs font-mono text-subtle">{PIANO.length} tracks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIANO.map((t) => (
            <PianoTrack key={t.id} track={t} />
          ))}
        </div>
      </div>

      {/* Travel / food */}
      <div>
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-xl sm:text-2xl font-medium tracking-tight">
            Places, plates
          </h3>
          <span className="text-xs font-mono text-subtle">scroll →</span>
        </div>
        <div className="-mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {FOOD_PHOTOS.map((p) => (
              <div
                key={p.src}
                className="relative shrink-0 w-[70vw] sm:w-[40vw] lg:w-[28vw] aspect-[3/4] snap-start overflow-hidden rounded-2xl bg-surface"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 28vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
