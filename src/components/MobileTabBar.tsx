"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import BottomSheet from "@/components/BottomSheet";
import ThemeToggle from "@/components/ThemeToggle";
import { promptInstall, useInstallState } from "@/components/AppChrome";
import { isActivePath, isGroup, PRIMARY_NAV, SECONDARY_LINKS } from "@/lib/nav";
import { localizeHref, switchLocaleHref, type Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { haptic, hapticsEnabled, setHapticsEnabled } from "@/lib/haptics";
import { DEFAULT_PREFS, readPrefs, TEXT_SIZES, writePrefs, type DisplayPrefs } from "@/lib/displayPrefs";

const TABS = [
  { href: "/", key: "home" as const, icon: "M2.5 7.5 8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H10v-4H6v4H3a.5.5 0 0 1-.5-.5V7.5Z" },
  { href: "/kundali", key: "kundli" as const, icon: "M2.5 2.5h11v11h-11zM2.5 2.5l11 11M13.5 2.5l-11 11M8 2.5 13.5 8 8 13.5 2.5 8Z" },
  { href: "/horoscope", key: "horoscope" as const, icon: "M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  { href: "/panchang", key: "panchang" as const, icon: "M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3" },
];

const QUICK = [
  { href: "/today", label: "Today", labelHi: "आज", icon: "M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  { href: "/matching", label: "Matching", labelHi: "मिलान", icon: "M5.5 12.5S1.5 10 1.5 6.5A2.3 2.3 0 0 1 5.5 5a2.3 2.3 0 0 1 4 1M10.5 14S6.5 11.5 6.5 8a2.3 2.3 0 0 1 4-1.5 2.3 2.3 0 0 1 4 1.5c0 3.5-4 6-4 6Z" },
  { href: "/horoscope/personal", label: "My day", labelHi: "मेरा दिन", icon: "M3 13.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" },
  { href: "/prashna", label: "Ask", labelHi: "प्रश्न", icon: "M6 6a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.5M8 11.5v.5M2.5 8a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0Z" },
  { href: "/muhurat", label: "Muhurat", labelHi: "मुहूर्त", icon: "M8 4.5V8l2.5 1.5M2.5 8a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0Z" },
  { href: "/panchang/month", label: "Calendar", labelHi: "कैलेंडर", icon: "M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3M5 9.5h1M7.5 9.5h1M10 9.5h1M5 11.5h1M7.5 11.5h1" },
  { href: "/numerology", label: "Numbers", labelHi: "अंक", icon: "M4 6h8M4 10h8M6.5 3 5.5 13M10.5 3l-1 10" },
  { href: "/sade-sati", label: "Sade Sati", labelHi: "साढ़े साती", icon: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM1.5 9.5c2-1.5 11-1.5 13 0" },
];

function Icon({ d, active }: { d: string; active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** App-style bottom navigation for phones and tablets: four destinations and a More sheet. Hidden from lg up and in the admin area. */
export default function MobileTabBar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const labels = getDictionary(locale).chrome.tabs;
  if (pathname?.startsWith("/admin")) return null;
  const hi = locale === "hi";
  const plain = hi ? pathname?.replace(/^\/hi(?=\/|$)/, "") || "/" : pathname;
  const activeTab = TABS.find((t) => (t.href === "/" ? plain === "/" : isActivePath(plain, t.href)))?.key ?? null;

  return (
    <>
      <nav aria-label="Quick" className="glass glass-lens fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 rounded-[1.75rem] lg:hidden print:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map((tab) => {
            const href = localizeHref(locale, tab.href);
            const active = activeTab === tab.key;
            return (
              <li key={tab.href}>
                <Link
                  href={href}
                  transitionTypes={["tab"]}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-0.5 pt-2 pb-2 text-[11px] font-medium transition-colors select-none ${active ? "text-gold-bright" : "text-muted"}`}
                >
                  {active && (
                    // The pill slides between tabs, then squashes and settles like a drop of liquid.
                    <motion.span layoutId="tabbar-pill" className="absolute top-1.5 h-8 w-14" transition={{ type: "spring", stiffness: 520, damping: 34 }}>
                      <motion.span
                        key={tab.key}
                        className="block h-full w-full rounded-full bg-gold/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                        initial={{ scaleX: 1.35, scaleY: 0.78 }}
                        animate={{ scaleX: 1, scaleY: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 14 }}
                      />
                    </motion.span>
                  )}
                  <span className="relative">
                    <Icon d={tab.icon} active={active} />
                  </span>
                  <span className="relative">{labels[tab.key]}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              aria-expanded={more}
              data-haptic="selection"
              className={`flex w-full flex-col items-center gap-0.5 pt-2 pb-2 text-[11px] font-medium select-none ${more ? "text-gold-bright" : "text-muted"}`}
            >
              <Icon d="M3 4.5h10M3 8h10M3 11.5h10" active={more} />
              {labels.more}
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet open={more} onClose={() => setMore(false)} title={labels.more}>
        <MoreSheet locale={locale} close={() => setMore(false)} pathname={pathname ?? "/"} />
      </BottomSheet>
    </>
  );
}

function MoreSheet({ locale, close, pathname }: { locale: Locale; close: () => void; pathname: string }) {
  const hi = locale === "hi";
  const lx = (h: string) => localizeHref(locale, h);
  const install = useInstallState();
  const [showIos, setShowIos] = useState(false);
  const hapticsOn = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener("haptics-changed", cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener("haptics-changed", cb);
      };
    },
    hapticsEnabled,
    () => true
  );

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <li key={q.href}>
            <Link href={lx(q.href)} onClick={close} transitionTypes={["nav-forward"]} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-1 py-3 text-center text-[11px] font-medium text-cream active:scale-95">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold-bright">
                <Icon d={q.icon} />
              </span>
              {hi ? q.labelHi : q.label}
            </Link>
          </li>
        ))}
      </ul>

      {PRIMARY_NAV.filter(isGroup).map((g) => (
        <section key={g.label}>
          <h2 className="px-1 text-xs font-semibold text-muted">{hi ? g.labelHi : g.label}</h2>
          <ul className="mt-1.5 divide-y divide-border/50 overflow-hidden rounded-2xl bg-surface">
            {g.items.map((item) => (
              <li key={item.href}>
                <Link href={lx(item.href)} onClick={close} transitionTypes={["nav-forward"]} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-surface-raised">
                  <span>
                    <span className="block text-sm font-medium text-cream">{hi ? (item.labelHi ?? item.label) : item.label}</span>
                    {item.description && <span className="block text-xs text-muted">{hi ? (item.descriptionHi ?? item.description) : item.description}</span>}
                  </span>
                  <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true" className="shrink-0 text-muted">
                    <path d="M1.5 1.5 6 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="px-1 text-xs font-semibold text-muted">{hi ? "सेटिंग्स" : "Settings"}</h2>
        <ul className="mt-1.5 divide-y divide-border/50 overflow-hidden rounded-2xl bg-surface text-sm">
          <li className="flex items-center justify-between px-4 py-3">
            <span className="text-cream">{hi ? "भाषा" : "Language"}</span>
            {/* Crossing languages changes the root layout, so a full page load is intended. */}
            <a href={switchLocaleHref(pathname, "", hi ? "en" : "hi")} hrefLang={hi ? "en" : "hi"} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-gold-bright">
              {hi ? "English" : "हिन्दी"}
            </a>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span className="text-cream">{hi ? "थीम" : "Theme"}</span>
            <ThemeToggle />
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <label htmlFor="haptics-toggle" className="text-cream">
              {hi ? "कंपन (हैप्टिक्स)" : "Haptics"}
            </label>
            <input
              id="haptics-toggle"
              type="checkbox"
              role="switch"
              checked={hapticsOn}
              onChange={(e) => {
                setHapticsEnabled(e.target.checked);
                window.dispatchEvent(new Event("haptics-changed"));
                if (e.target.checked) haptic("success");
              }}
              className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-border transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-cream before:transition-transform checked:bg-gold checked:before:translate-x-[1.35rem]"
            />
          </li>
          <DisplaySettings hi={hi} />
          {install !== "installed" && install !== "unavailable" && (
            <li className="px-4 py-3">
              <button
                type="button"
                data-haptic="medium"
                onClick={() => (install === "prompt" ? void promptInstall() : setShowIos((v) => !v))}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-cream">{hi ? "ऐप इंस्टॉल करें" : "Install the app"}</span>
                <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-on-gold">{hi ? "इंस्टॉल" : "Install"}</span>
              </button>
              {showIos && (
                <p className="mt-2 text-xs text-muted">
                  {hi ? "Safari में शेयर बटन दबाएँ, फिर “Add to Home Screen” चुनें।" : "In Safari, tap the Share button, then choose “Add to Home Screen”."}
                </p>
              )}
            </li>
          )}
        </ul>
      </section>

      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
        {SECONDARY_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={lx(l.href)} onClick={close}>
              {hi ? (l.labelHi ?? l.label) : l.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/account" onClick={close}>
            {hi ? "खाता" : "Account"}
          </Link>
        </li>
      </ul>
    </div>
  );
}

function useDisplayPrefs(): DisplayPrefs {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener("display-prefs", cb);
      return () => window.removeEventListener("display-prefs", cb);
    },
    () => JSON.stringify(readPrefs()),
    () => JSON.stringify(DEFAULT_PREFS)
  );
  return JSON.parse(raw);
}

/** Text size, glass transparency (iOS 27's slider) and tilt-to-move-light. */
function DisplaySettings({ hi }: { hi: boolean }) {
  const prefs = useDisplayPrefs();
  const set = (patch: Partial<DisplayPrefs>) => writePrefs({ ...prefs, ...patch });

  async function toggleTilt(on: boolean) {
    // iPhone asks once for motion access; it has to come from this tap.
    const Req = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (on && Req?.requestPermission) {
      const answer = await Req.requestPermission().catch(() => "denied");
      if (answer !== "granted") return;
    }
    set({ tilt: on });
    if (on) haptic("success");
  }

  return (
    <>
      <li className="px-4 py-3">
        <p className="text-cream">{hi ? "अक्षर का आकार" : "Text size"}</p>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-full bg-ink-deep p-1" role="radiogroup" aria-label={hi ? "अक्षर का आकार" : "Text size"}>
          {TEXT_SIZES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={prefs.textScale === t.value}
              onClick={() => set({ textScale: t.value })}
              className={`rounded-full py-1.5 text-sm font-semibold ${prefs.textScale === t.value ? "bg-gold text-on-gold" : "text-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </li>
      <li className="px-4 py-3">
        <label htmlFor="glass-slider" className="flex justify-between text-cream">
          <span>{hi ? "ग्लास" : "Glass"}</span>
          <span className="text-xs text-muted">{prefs.glass < 34 ? (hi ? "साफ़" : "Clear") : prefs.glass > 66 ? (hi ? "गहरा" : "Tinted") : hi ? "संतुलित" : "Balanced"}</span>
        </label>
        <input
          id="glass-slider"
          type="range"
          min={0}
          max={100}
          step={5}
          value={prefs.glass}
          onChange={(e) => set({ glass: Number(e.target.value) })}
          onPointerUp={() => haptic("selection")}
          className="mt-2 w-full accent-[var(--color-gold)]"
        />
        <span className="flex justify-between text-[11px] text-muted" aria-hidden="true">
          <span>{hi ? "साफ़" : "Clear"}</span>
          <span>{hi ? "गहरा" : "Tinted"}</span>
        </span>
      </li>
      <li className="flex items-center justify-between px-4 py-3">
        <label htmlFor="tilt-toggle" className="text-cream">
          {hi ? "झुकाने पर रोशनी" : "Light follows tilt"}
        </label>
        <input
          id="tilt-toggle"
          type="checkbox"
          role="switch"
          checked={prefs.tilt}
          onChange={(e) => void toggleTilt(e.target.checked)}
          className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-border transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-cream before:transition-transform checked:bg-gold checked:before:translate-x-[1.35rem]"
        />
      </li>
    </>
  );
}
