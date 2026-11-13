"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import MobileHome from "./MobileHome";
import type { SkyPosition } from "@/lib/skyDial";
import type { Locale } from "@/lib/i18n/locale";

const subscribe = (notify: () => void) => {
  const media = window.matchMedia("(max-width:1023px)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const mobileSnapshot = () => window.matchMedia("(max-width:1023px)").matches;

/** Mount only the active experience; mobile never starts the WebGL scene. */
export default function ResponsiveHome({ children, locale, positions, at }: { children: ReactNode; locale: Locale; positions: SkyPosition[]; at: string }) {
  const mobile = useSyncExternalStore(subscribe, mobileSnapshot, () => false);
  return mobile ? <MobileHome locale={locale} positions={positions} at={at}/> : <div className="desktop-home">{children}</div>;
}
