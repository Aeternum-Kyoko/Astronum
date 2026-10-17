import Link from "next/link";
import { type NavItem } from "@/lib/nav";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

const EXPLORE: NavItem[] = [
  { href: "/kundali", label: "Birth chart", labelHi: "जन्म कुंडली" },
  { href: "/matching", label: "Matching", labelHi: "मिलान" },
  { href: "/horoscope", label: "Horoscope", labelHi: "राशिफल" },
  { href: "/panchang", label: "Panchang", labelHi: "पंचांग" },
  { href: "/muhurat", label: "Muhurat", labelHi: "मुहूर्त" },
  { href: "/consultation", label: "Consultation", labelHi: "परामर्श" },
];

const LEARN: NavItem[] = [
  { href: "/learn", label: "All topics", labelHi: "सभी विषय" },
  { href: "/learn/planets", label: "Planets", labelHi: "ग्रह" },
  { href: "/learn/signs", label: "Signs", labelHi: "राशियाँ" },
  { href: "/learn/glossary", label: "Glossary", labelHi: "शब्दकोश" },
  { href: "/blog", label: "Articles", labelHi: "लेख" },
  { href: "/about", label: "About", labelHi: "हमारे बारे में" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/contact", label: "Contact" },
];

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).chrome;
  const label = (i: NavItem) => (locale === "hi" && i.labelHi) || i.label;

  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-ink-deep">
      <div className="relative mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold text-cream">Astronum</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{t.footerTagline}</p>
          </div>

          <FooterList title={t.explore} items={EXPLORE} locale={locale} label={label} />
          <FooterList title={t.learn} items={LEARN} locale={locale} label={label} />

          <div>
            <p className="text-sm font-medium text-gold-bright">{t.noteTitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.note}</p>
          </div>
        </div>

        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <nav aria-label="Legal" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
          {LEGAL.map((l) => (
            <Link key={l.href} href={localizeHref(locale, l.href)} className="hover:text-cream">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} Astronum. {t.rights}
        </p>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  items,
  locale,
  label,
}: {
  title: string;
  items: NavItem[];
  locale: Locale;
  label: (i: NavItem) => string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gold-bright">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={localizeHref(locale, item.href)} className="hover:text-cream">
              {label(item)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
