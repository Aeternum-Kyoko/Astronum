import type { Metadata } from "next";
import VastuTool from "@/components/VastuTool";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "Vāstu Calculator — Home Layout and Kundli Context",
  description: "Review your home layout, directions, daylight and ventilation with traditional Vāstu observations and optional personal Kundli context.",
  alternates: languageAlternates("/vastu"),
};

export default function VastuPage() {
  return <section className="relative"><div className="mx-auto max-w-5xl px-5 py-14 md:py-20"><VastuTool /></div></section>;
}
