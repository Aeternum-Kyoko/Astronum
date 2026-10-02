import type { Metadata } from "next";
import Link from "next/link";
import PalmReader from "@/components/PalmReader";

export const metadata: Metadata = {
  title: "Palm Reading — Live Palmistry from Your Camera",
  description:
    "Show your palm to the camera and watch your heart, head, life and fate lines being traced live, then get a full Hasta Samudrika reading of your lines, the nine mounts and their markings, hand shape and fingers — cross-checked with your kundli. Runs on your device.",
  alternates: { canonical: "/palmistry" },
};

export default function PalmistryPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">Palmistry · Hasta Samudrika Shastra</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">Read your palm, live</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Hold your open palm to the camera. Your lines are traced as you move and steadied over many frames; once the
            picture is sharp and evenly lit it captures by itself and reads your lines, mounts, hand shape and fingers.
          </p>
        </header>
        <div className="mt-10">
          <PalmReader />
        </div>
        <section className="card-edge mt-10 rounded-2xl p-6 text-sm leading-relaxed text-muted">
          <h2 className="text-lg font-bold text-cream">For the best reading</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use bright, even light — a window to one side shows the creases best. Avoid a flash straight on.</li>
            <li>Keep the palm flat and the fingers straight, filling most of the frame — the app tells you if the hand is curled or tilted.</li>
            <li>For the mounts, press each fleshy pad gently and choose flat, normal or full — a photo alone can&rsquo;t show how raised a mount is.</li>
            <li>Palmists read the hand you write with for the life you are shaping, and the other for what you were born with.</li>
          </ul>
          <p className="mt-4">
            Palmistry is a traditional art for reflection, not a medical or financial guide. For timing and detail, your{" "}
            <Link href="/kundali" className="font-semibold text-gold-bright hover:text-gold">
              birth chart
            </Link>{" "}
            goes much further.
          </p>
        </section>
      </div>
    </section>
  );
}
