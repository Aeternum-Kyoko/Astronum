import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About the astrologer behind Astronum.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">About</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The Astrologer</h1>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-[220px_1fr] md:items-start">
        <div className="relative mx-auto h-48 w-48">
          <div className="glow-blob glow-blob-gold inset-0 h-48 w-48 opacity-60" />
          <div className="card-edge relative flex h-48 w-48 items-center justify-center rounded-full text-5xl">
            🙏
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl text-cream">[Astrologer&apos;s Name]</h2>
          <p className="mt-1 text-sm text-gold-bright">[Years] years of practice · Vedic (Jyotish) Astrology</p>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              [Write a short, warm introduction here: how you came to astrology, what tradition or
              lineage you studied under, and what drives your practice today.]
            </p>
            <p>
              [Mention specific areas of focus — e.g. marriage matching, career timing, dasha
              analysis, remedial measures — and how you typically work with people who come to you
              for a reading.]
            </p>
            <p>
              [Optional: any credentials, publications, or notable experience worth sharing.]
            </p>
          </div>

          <Link
            href="/consultation"
            className="btn-shimmer mt-8 inline-block rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink-deep hover:bg-gold-bright"
          >
            Book a Personal Reading
          </Link>
        </div>
      </div>

      <div className="gold-divider mt-16" />

      <div className="mt-12 text-center">
        <h3 className="font-display text-xl text-cream">A Note on This Approach</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every chart on this site is calculated using the sidereal (Lahiri) zodiac, the standard
          used in traditional Vedic astrology. The free kundali tool gives you the placements —
          planets, houses, nakshatras, and dashas. A personal reading is where those placements are
          read together as a story about your life.
        </p>
      </div>
    </section>
  );
}
