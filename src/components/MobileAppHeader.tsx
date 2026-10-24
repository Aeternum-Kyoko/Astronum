"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { mobileNavigation } from "@/lib/mobileNavigation";
import MoonMark from "./MoonMark";

export default function MobileAppHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const nav = mobileNavigation(pathname);
  const hi = locale === "hi";
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let fullHeight = window.innerHeight;
    const update = () => {
      const editing = document.activeElement?.matches("input,textarea,[contenteditable=true]") ?? false;
      if (!editing) fullHeight = window.innerHeight;
      document.documentElement.style.setProperty("--app-visible-height", `${viewport.height}px`);
      document.documentElement.style.setProperty("--app-viewport-offset", `${viewport.offsetTop}px`);
      document.body.dataset.keyboardOpen = String(editing && fullHeight - viewport.height > 140);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update); document.removeEventListener("focusout", update);
      delete document.body.dataset.keyboardOpen;
      document.documentElement.style.removeProperty("--app-visible-height");
      document.documentElement.style.removeProperty("--app-viewport-offset");
    };
  }, []);
  if (pathname.startsWith("/admin")) return null;
  return <header className="mobile-app-header print:hidden">
    {!nav.root ? <button type="button" className="mobile-header-back" aria-label={hi ? "वापस" : "Back"} onClick={() => startTransition(() => {
      addTransitionType("nav-back");
      if (window.history.length > 1) router.back(); else router.push(localizeHref(locale, "/"));
    })}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button> : <Link className="mobile-header-brand" href={localizeHref(locale,"/")} aria-label="Astronum" transitionTypes={["tab"]}><MoonMark /></Link>}
    <div className="mobile-header-title"><span>{hi ? nav.titleHi : nav.title}</span><small>{nav.tab === "home" ? (hi ? "आपका दैनिक ज्योतिष" : "Your daily astrology") : (hi ? "Astronum में जानें" : "Explore with Astronum")}</small></div>
    <Link href="/account" className="mobile-header-account" aria-label={hi ? "मेरी कुंडलियाँ और खाता" : "My charts and account"} transitionTypes={["nav-forward"]}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></Link>
  </header>;
}
