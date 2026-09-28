import Link from "next/link";
import { KUNDLI_LINKS, LEARN_LINKS, PANCHANG_LINKS, SECONDARY_LINKS, type NavItem } from "@/lib/nav";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

const EXPLORE: NavItem[] = [
  ...KUNDLI_LINKS.filter((l) => l.href !== "/learn/gemstones"),
  { href: "/horoscope", label: "Daily Horoscope", labelHi: "दैनिक राशिफल" },
  ...PANCHANG_LINKS,
  ...SECONDARY_LINKS,
  { href: "/consultation", label: "Book a Consultation", labelHi: "परामर्श बुक करें" },
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
          <FooterList title={t.learn} items={LEARN_LINKS} locale={locale} label={label} />

          <div>
            <p className="text-sm font-medium text-gold-bright">{t.noteTitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.note}</p>
          </div>
        </div>

        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <nav aria-label="Legal" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-cream">
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
