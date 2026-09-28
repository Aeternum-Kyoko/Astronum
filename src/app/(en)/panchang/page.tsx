import type { Metadata } from "next";
import PanchangView from "@/components/views/PanchangView";
import { getDictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/locale";

const t = getDictionary("en").panchang;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: languageAlternates("/panchang"),
};

export default async function PanchangPage({ searchParams }: PageProps<"/panchang">) {
  return <PanchangView locale="en" params={await searchParams} />;
}
