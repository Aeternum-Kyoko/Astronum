import type { Metadata } from "next";
import PanchangView from "@/components/views/PanchangView";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("hi").panchang;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: { ...languageAlternates("/panchang"), canonical: "/hi/panchang" },
};

export default async function HindiPanchangPage({ searchParams }: PageProps<"/hi/panchang">) {
  return <PanchangView locale="hi" params={await searchParams} />;
}
