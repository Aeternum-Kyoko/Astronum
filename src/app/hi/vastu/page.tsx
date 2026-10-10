import type { Metadata } from "next";
import VastuTool from "@/components/VastuTool";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "वास्तु कैलकुलेटर — घर का नक्शा और कुंडली",
  description: "पारंपरिक वास्तु संकेतों और व्यक्तिगत कुंडली संदर्भ के साथ घर की दिशा, नक्शा, रोशनी और हवादारी देखें।",
  alternates: { ...languageAlternates("/vastu"), canonical: "/hi/vastu" },
};

export default function HindiVastuPage() {
  return <section className="relative"><div className="mx-auto max-w-5xl px-5 py-14 md:py-20"><VastuTool locale="hi" /></div></section>;
}
