import Link from "next/link";
import ZodiacWheel from "@/components/ZodiacWheel";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-ink-deep">
      <ZodiacWheel className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 opacity-[0.06]" />

      <div className="relative mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="font-display text-lg text-cream">
              Astro<span className="text-gradient-gold">num</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Vedic astrology rooted in tradition — your kundali, explained clearly, with guidance
              you can actually use.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gold-bright">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/kundali" className="hover:text-cream">Free Kundali Generator</Link></li>
              <li><Link href="/blog" className="hover:text-cream">Blog</Link></li>
              <li><Link href="/about" className="hover:text-cream">About the Astrologer</Link></li>
              <li><Link href="/consultation" className="hover:text-cream">Book a Consultation</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-gold-bright">Learn</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/learn/planets" className="hover:text-cream">Planets</Link></li>
              <li><Link href="/learn/signs" className="hover:text-cream">Signs</Link></li>
              <li><Link href="/learn/houses" className="hover:text-cream">Houses</Link></li>
              <li><Link href="/learn/nakshatras" className="hover:text-cream">Nakshatras</Link></li>
              <li><Link href="/learn/yogas" className="hover:text-cream">Yogas & Doshas</Link></li>
              <li><Link href="/learn/divisional-charts" className="hover:text-cream">Divisional Charts</Link></li>
              <li><Link href="/learn/dasha-system" className="hover:text-cream">Dasha System</Link></li>
              <li><Link href="/learn/glossary" className="hover:text-cream">Glossary</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-gold-bright">A note on this site</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Kundali charts here are generated for guidance and self-reflection. They are not a
              substitute for professional medical, legal, or financial advice.
            </p>
          </div>
        </div>

        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <p className="mt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Astronum. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
