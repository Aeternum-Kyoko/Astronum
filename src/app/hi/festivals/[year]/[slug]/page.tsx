import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { FestivalDetailView, loadFestival } from "@/components/views/FestivalViews";
import { FESTIVALS } from "@/lib/astrology/festivals";
import { observanceName } from "@/lib/astrology/festivalsText";
import { parseYear } from "@/lib/festivalPages";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("hi").festivals;

async function load(params: PageProps<"/hi/festivals/[year]/[slug]">["params"]) {
  const { year: rawYear, slug } = await params;
  const year = parseYear(rawYear);
  if (!year || !(FESTIVALS.some((f) => f.slug === slug) || slug === "makar-sankranti")) return null;
  const festival = loadFestival(year, slug);
  return festival ? { year, festival } : null;
}

export async function generateMetadata({ params }: PageProps<"/hi/festivals/[year]/[slug]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { year, festival } = data;
  const name = observanceName(festival, "hi").split(" · ")[0];
  const when = DateTime.fromISO(festival.date).setLocale("hi").toFormat("cccc, d LLLL yyyy");
  return {
    title: t.metaTitle(name, year),
    description: t.metaDescription(name, year, when),
    alternates: { ...languageAlternates(`/festivals/${year}/${festival.slug}`), canonical: `/hi/festivals/${year}/${festival.slug}` },
  };
}

export default async function HindiFestivalPage({ params }: PageProps<"/hi/festivals/[year]/[slug]">) {
  const data = await load(params);
  if (!data) notFound();
  return <FestivalDetailView locale="hi" year={data.year} slug={data.festival.slug} />;
}
