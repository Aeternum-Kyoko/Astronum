"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import MoonMark from "@/components/MoonMark";
import ThemeToggle from "@/components/ThemeToggle";
import AccountButton from "@/components/AccountButton";
import { PRIMARY_NAV, isActivePath, isGroup, type NavGroup, type NavItem } from "@/lib/nav";
import { localizeHref, switchLocaleHref, type Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).chrome;
  const hi = locale === "hi";
  const itemLabel = (i: NavItem) => (hi && i.labelHi) || i.label;
  const itemDesc = (i: NavItem) => (hi && i.descriptionHi) || i.description;
  const href = (path: string) => localizeHref(locale, path);
  const [menu, setMenu] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const router = useRouter();
  const plainPath0 = hi ? pathname?.replace(/^\/hi(?=\/|$)/, "") || "/" : pathname;
  // The tab bar's destinations are top-level screens; everywhere else gets a back button on phones.
  const isRootPath = ["/", "/kundali", "/horoscope", "/panchang"].includes(plainPath0 ?? "/");
  function goBack() {
    startTransition(() => {
      addTransitionType("nav-back");
      if (window.history.length > 1) router.back();
      else router.push(href("/"));
    });
  }

  useMotionValueEvent(scrollY, "change", (y) => {
    if (menu) return;
    const goingDown = y > lastY.current;
    setHidden(goingDown && y > 120);
    lastY.current = y;
  });

  // Close menus whenever the route changes (the "adjust state during render" pattern).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenu(null);
  }

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  function openMenu(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(label);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setMenu(null), 120);
  }

  const activeGroup = PRIMARY_NAV.find((e): e is NavGroup => isGroup(e) && e.label === menu);
  const plainPath = hi ? pathname?.replace(/^\/hi(?=\/|$)/, "") || "/" : pathname;
  const groupActive = (g: NavGroup) => g.matches.some((m) => isActivePath(plainPath, m));
  const switchHref = switchLocaleHref(pathname ?? "/", "", hi ? "en" : "hi");

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-border/60 bg-ink-deep/90 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden"
    >
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-1">
          {!isRootPath && (
            <button type="button" onClick={goBack} data-haptic="light" aria-label={hi ? "वापस" : "Back"} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cream active:bg-surface lg:hidden">
              <svg width="11" height="18" viewBox="0 0 11 18" aria-hidden="true">
                <path d="M9 2 2 9l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <Link href={href("/")} transitionTypes={["tab"]} className="flex items-center gap-2.5">
            <MoonMark />
            <span className="font-display text-xl font-semibold text-cream">Astronum</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {PRIMARY_NAV.map((entry) => {
            if (isGroup(entry)) {
              const isOpen = menu === entry.label;
              return (
                <div key={entry.label} onMouseEnter={() => openMenu(entry.label)} onMouseLeave={scheduleClose}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls="nav-menu"
                    onClick={() => setMenu(isOpen ? null : entry.label)}
                    className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors hover:text-gold-bright ${
                      groupActive(entry) || isOpen ? "text-cream" : "text-muted"
                    }`}
                  >
                    {hi ? entry.labelHi : entry.label}
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            }
            const active = isActivePath(plainPath, entry.href);
            return (
              <Link
                key={entry.href}
                href={href(entry.href)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm transition-colors hover:text-gold-bright ${active ? "text-cream" : "text-muted"}`}
              >
                {itemLabel(entry)}
              </Link>
            );
          })}
          {/* Crossing languages changes root layout, so a plain <a> (full load) is intended. */}
          <a href={switchHref} hrefLang={hi ? "en" : "hi"} lang={hi ? "en" : "hi"} title={t.languageLabel} className="ml-1 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-gold-bright">
            {t.language}
          </a>
          <ThemeToggle className="ml-1" />
          <span className="ml-2">
            <AccountButton label={t.signIn} />
          </span>
          <Link
            href={href("/kundali")}
            className="ml-2 hidden rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold transition-colors hover:bg-gold-bright xl:inline-block"
          >
            {t.generateKundli}
          </Link>
        </nav>

        {/* Phones: settings, language and every section live in the tab bar's More sheet. */}
        <div className="flex items-center gap-2 lg:hidden">
          <AccountButton label={t.signIn} />
        </div>

        <AnimatePresence>
          {activeGroup && (
            <motion.div
              key={activeGroup.label}
              id="nav-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onMouseEnter={() => openMenu(activeGroup.label)}
              onMouseLeave={scheduleClose}
              className="card-glass shadow-floating absolute top-full right-5 left-5 mt-1 hidden rounded-2xl p-5 lg:block"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
                <div className="rounded-xl bg-gold/10 p-5">
                  <p className="text-xs font-semibold text-gold-bright">{hi ? activeGroup.labelHi : activeGroup.label}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{hi ? activeGroup.blurbHi : activeGroup.blurb}</p>
                </div>
                <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGroup.items.map((item) => (
                    <li key={item.href}>
                      <Link href={href(item.href)} className="block rounded-xl p-3 transition-colors hover:bg-surface-raised">
                        <span className="block text-sm font-semibold text-cream">{itemLabel(item)}</span>
                        <span className="mt-1 block text-xs leading-snug text-muted">{itemDesc(item)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.header>
  );
}
