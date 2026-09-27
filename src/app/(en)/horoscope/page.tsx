import type { Metadata } from "next";
import { HoroscopeIndexView, parseBy } from "@/components/views/HoroscopeViews";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("en").horoscope;

export const metadata: Metadata = {
  title: t.metaIndexTitle,
  description: t.metaIndexDescription,
  alternates: languageAlternates("/horoscope"),
};

export default async function HoroscopeIndexPage({ searchParams }: PageProps<"/horoscope">) {
  const { day, by } = await searchParams;
  return <HoroscopeIndexView locale="en" day={day} by={parseBy(by)} />;
}
