"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

const TABS = [
  { href: "/", key: "home" as const, icon: "M2.5 7.5 8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H10v-4H6v4H3a.5.5 0 0 1-.5-.5V7.5Z" },
  { href: "/kundali", key: "kundli" as const, icon: "M2.5 2.5h11v11h-11zM2.5 2.5l11 11M13.5 2.5l-11 11M8 2.5 13.5 8 8 13.5 2.5 8Z" },
  { href: "/matching", key: "matching" as const, icon: "M5.5 12.5S1.5 10 1.5 6.5A2.3 2.3 0 0 1 5.5 5a2.3 2.3 0 0 1 4 1M10.5 14S6.5 11.5 6.5 8a2.3 2.3 0 0 1 4-1.5 2.3 2.3 0 0 1 4 1.5c0 3.5-4 6-4 6Z" },
  { href: "/panchang", key: "panchang" as const, icon: "M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3" },
  { href: "/horoscope", key: "horoscope" as const, icon: "M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
];

/** Thumb-reachable primary navigation for phones and tablets; hidden from lg up and in the admin area. */
export default function MobileTabBar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = getDictionary(locale).chrome.tabs;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Quick"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-ink-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const href = localizeHref(locale, tab.href);
          const active = isActivePath(pathname, href);
          return (
            <li key={tab.href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-gold-bright" : "text-muted"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d={tab.icon} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                {labels[tab.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
