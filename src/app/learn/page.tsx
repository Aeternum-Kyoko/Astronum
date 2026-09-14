import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Learn Vedic Astrology",
  description:
    "A compiled Jyotish reference — the nine grahas, twelve rashis, twelve bhavas, twenty-seven nakshatras, classical yogas, all sixteen divisional charts, the Vimshottari dasha system, and a glossary of terms.",
};

const CATEGORIES = [
  { href: "/learn/planets", title: "The 9 Planets", blurb: "Nature, significations, dignity, and what each graha means placed in every house.", count: "9 entries" },
  { href: "/learn/signs", title: "The 12 Signs", blurb: "Element, quality, ruling planet, and character of every rashi.", count: "12 entries" },
  { href: "/learn/houses", title: "The 12 Houses", blurb: "What each bhava governs, its classification, and natural significator.", count: "12 entries" },
  { href: "/learn/nakshatras", title: "The 27 Nakshatras", blurb: "Ruling planet, deity, symbol, and temperament of every lunar mansion.", count: "27 entries" },
  { href: "/learn/yogas", title: "Yogas & Doshas", blurb: "A classical combinations glossary — which ones this site's engine detects, and which are reference-only.", count: "30+ entries" },
  { href: "/learn/divisional-charts", title: "The 16 Divisional Charts", blurb: "What every varga from D2 to D60 is actually used to examine.", count: "16 entries" },
  { href: "/learn/dasha-system", title: "The Dasha System", blurb: "How Vimshottari Dasha works, from the Moon's nakshatra to a full 120-year cycle.", count: "1 guide" },
  { href: "/learn/glossary", title: "Glossary", blurb: "Sanskrit and technical terms used across the site, defined plainly.", count: "50+ terms" },
];

export default function LearnHubPage() {
  return (
    <section className="relative overflow-hidden bg-stars">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/20 to-ink" />
      <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-32">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-bright uppercase">Reference Library</p>
          <h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tight text-cream sm:text-6xl">
            Learn <span className="text-gold-bright">Jyotish.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            A compiled classical Vedic astrology reference — every planet, sign, house, and nakshatra, plus
            yogas, divisional charts, and the dasha system, organized so the whole thing can actually be browsed.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.href} delay={i * 0.05}>
              <Link href={c.href} className="card-edge group block h-full rounded-2xl p-6 transition-transform hover:-translate-y-1">
                <p className="text-xs font-semibold tracking-wide text-gold uppercase">{c.count}</p>
                <h2 className="mt-2 font-display text-xl text-cream group-hover:text-gold-bright">{c.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{c.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
