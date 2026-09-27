import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SIGNS, SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { signFromSlug, SIGN_SLUGS } from "@/lib/astrology/horoscope";
import PeriodHoroscopeView, { PERIODS, resolvePeriodAnchor, type HoroscopePeriod } from "@/components/views/PeriodHoroscopeView";

const LABEL: Record<HoroscopePeriod, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

function parse(sign: string, period: string) {
  const i = signFromSlug(sign);
  return i !== null && (PERIODS as string[]).includes(period) ? { i, period: period as HoroscopePeriod } : null;
}

export async function generateMetadata({ params }: PageProps<"/horoscope/[sign]/[period]">): Promise<Metadata> {
  const { sign, period } = await params;
  const p = parse(sign, period);
  if (!p) return {};
  const name = SIGNS[p.i];
  return {
    title: `${name} ${LABEL[p.period]} Horoscope (${SIGN_SANSKRIT[p.i]} Rashifal)`,
    description: `${LABEL[p.period]} Vedic horoscope for ${name} Moon sign — planetary transits, key dates, good days and days to go gently, computed from the actual sky.`,
    alternates: { canonical: `/horoscope/${SIGN_SLUGS[p.i]}/${p.period}` },
  };
}

export default async function PeriodHoroscopePage({ params, searchParams }: PageProps<"/horoscope/[sign]/[period]">) {
  const { sign, period } = await params;
  const p = parse(sign, period);
  if (!p) notFound();
  const { at } = await searchParams;
  return <PeriodHoroscopeView signIndex={p.i} period={p.period} anchor={resolvePeriodAnchor(p.period, typeof at === "string" ? at : undefined)} />;
}
