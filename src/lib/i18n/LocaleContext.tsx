"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./locale";
import { translate } from "./ui";

const LocaleContext = createContext<Locale>("en");

/** Makes the page's language available to every client component below it. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `t("Planet")` → the Hindi interface string on Hindi pages, the English one otherwise. */
export function useT(): (en: string) => string {
  const locale = useContext(LocaleContext);
  return (en: string) => translate(locale, en);
}
