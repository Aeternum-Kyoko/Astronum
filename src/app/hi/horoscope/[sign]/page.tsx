import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SIGNS, SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { signFromSlug, SIGN_SLUGS } from "@/lib/astrology/horoscope";
import { HoroscopeSignView, parseBy } from "@/components/views/HoroscopeViews";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

const t = getDictionary("hi").horoscope;

export async function generateMetadata({ params }: PageProps<"/hi/horoscope/[sign]">): Promise<Metadata> {
  const { sign } = await params;
  const i = signFromSlug(sign);
  if (i === null) return {};
  const name = term("hi", SIGNS[i]);
  return {
    title: t.metaSignTitle(name, SIGN_SANSKRIT[i]),
    description: t.metaSignDescription(name, SIGN_SANSKRIT[i]),
    alternates: { ...languageAlternates(`/horoscope/${SIGN_SLUGS[i]}`), canonical: `/hi/horoscope/${SIGN_SLUGS[i]}` },
    openGraph: { images: [{ url: `/api/share/horoscope?sign=${SIGN_SLUGS[i]}`, width: 1080, height: 1350 }] },
  };
}

export default async function HindiSignHoroscopePage({ params, searchParams }: PageProps<"/hi/horoscope/[sign]">) {
  const { sign } = await params;
  const i = signFromSlug(sign);
  if (i === null) notFound();
  const { day, by } = await searchParams;
  return <HoroscopeSignView locale="hi" signIndex={i} day={day} by={parseBy(by)} />;
}
