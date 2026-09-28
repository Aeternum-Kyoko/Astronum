import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FestivalYearView } from "@/components/views/FestivalViews";
import { parseYear } from "@/lib/festivalPages";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("hi").festivals;

export async function generateMetadata({ params }: PageProps<"/hi/festivals/[year]">): Promise<Metadata> {
  const year = parseYear((await params).year);
  if (!year) return {};
  return {
    title: t.metaYearTitle(year),
    description: t.metaYearDescription(year),
    alternates: { ...languageAlternates(`/festivals/${year}`), canonical: `/hi/festivals/${year}` },
  };
}

export default async function HindiFestivalYearPage({ params, searchParams }: PageProps<"/hi/festivals/[year]">) {
  const year = parseYear((await params).year);
  if (!year) notFound();
  const { type } = await searchParams;
  return <FestivalYearView locale="hi" year={year} type={type} />;
}
