import type { Metadata } from "next";
import { HoroscopeIndexView, parseBy } from "@/components/views/HoroscopeViews";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("hi").horoscope;

export const metadata: Metadata = {
  title: t.metaIndexTitle,
  description: t.metaIndexDescription,
  alternates: { ...languageAlternates("/horoscope"), canonical: "/hi/horoscope" },
};

export default async function HindiHoroscopeIndexPage({ searchParams }: PageProps<"/hi/horoscope">) {
  const { day, by } = await searchParams;
  return <HoroscopeIndexView locale="hi" day={day} by={parseBy(by)} />;
}
