import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Manish Dave — Vedic Astrologer in Jodhpur, Rajasthan",
  description: "Manish Dave is a Vedic (Jyotish) astrologer based in Jodhpur, Rajasthan, offering kundli readings, marriage matching, muhurat and remedies.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Manish Dave",
          alternateName: "मनीष दवे",
          jobTitle: "Vedic Astrologer",
          knowsAbout: ["Vedic astrology", "Jyotish", "Kundli", "Kundli matching", "Muhurat", "Numerology"],
          address: { "@type": "PostalAddress", addressLocality: "Jodhpur", addressRegion: "Rajasthan", addressCountry: "IN" },
          url: absoluteUrl("/about"),
        }}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-gold-bright">About</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The Astrologer</h1>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-[220px_1fr] md:items-start">
        <div className="relative mx-auto h-48 w-48">
          <div className="card-edge relative flex h-48 w-48 flex-col items-center justify-center rounded-full">
            <span className="font-display text-5xl text-gold-bright">MD</span>
            <span className="mt-1 text-xs text-muted">मनीष दवे</span>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl text-cream">Manish Dave</h2>
          <p className="mt-1 text-sm text-gold-bright">Vedic (Jyotish) Astrologer · Jodhpur, Rajasthan</p>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              Manish Dave is a Vedic astrologer based in Jodhpur, Rajasthan. His work follows classical Jyotish: reading the birth
              chart as a whole — the Lagna and its lord, the Moon, the divisional charts and the running dashas — before saying
              anything about a single question.
            </p>
            <p>
              People come to him for kundli readings, marriage matching, the timing of career and family decisions, auspicious
              muhurats and practical remedies — with every conclusion explained from the chart rather than handed down as a
              verdict.
            </p>
            <p>
              Astronum grew out of that practice: the free tools here calculate your chart the traditional way, with the reasons
              shown, so you can come to a consultation already understanding your own kundli.
            </p>
          </div>

          <Link href="/consultation" className="mt-8 inline-block rounded-full bg-gold px-6 py-3 text-sm font-semibold text-on-gold hover:bg-gold-bright">
            Book a reading with Manish Dave
          </Link>
        </div>
      </div>

      <div className="mt-16 h-px bg-border" />

      <div className="mt-12 text-center">
        <h3 className="font-display text-xl text-cream">A Note on This Approach</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every chart on this site is calculated using the sidereal (Lahiri) zodiac, the standard used in traditional Vedic
          astrology. The free kundali tool gives you the placements — planets, houses, nakshatras, and dashas. A personal reading
          is where those placements are read together as a story about your life.
        </p>
      </div>
    </section>
  );
}
