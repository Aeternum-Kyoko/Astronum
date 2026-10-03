import type { Metadata } from "next";
import Link from "next/link";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import RudrakshaPanel from "@/components/RudrakshaPanel";
import { calculateKundali } from "@/lib/astrology/kundali";
import { toBirthQuery } from "@/lib/birthParams";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "कुंडली अनुसार रुद्राक्ष — कौन सा मुखी आपके लिए, और क्यों",
  description: "जानें आपकी जन्म कुंडली को कौन से रुद्राक्ष चाहिए — आजीवन लग्न रुद्राक्ष, चल रही दशा के रुद्राक्ष, और कमज़ोर ग्रह, साढ़े साती व दोषों के उपाय — हर कारण, मंत्र और धारण विधि सहित।",
  alternates: { ...languageAlternates("/rudraksha"), canonical: "/hi/rudraksha" },
};

export default async function HindiRudrakshaPage({ searchParams }: PageProps<"/hi/rudraksha">) {
  const birth = birthFromParams(await searchParams);
  const chart = birth ? calculateKundali(birth) : null;
  return (
    <ToolShell
      eyebrow="कुंडली अनुसार रुद्राक्ष"
      title="कौन सा रुद्राक्ष आपके लिए, और क्यों"
      intro="हर रुद्राक्ष का एक स्वामी ग्रह होता है। अपना जन्म विवरण भरें और देखें कि आपकी कुंडली को कौन से रुद्राक्ष चाहिए — आजीवन, वर्तमान दशा के लिए और उपाय के रूप में — हर कारण सहित।"
      path="/hi/rudraksha"
      submit="मेरा रुद्राक्ष जानें"
      birth={birth}
      locale="hi"
    >
      {chart && birth && (
        <>
          <RudrakshaPanel chart={JSON.parse(JSON.stringify(chart))} locale="hi" />
          <p className="mt-8 text-center text-sm text-muted">
            पूरा विश्लेषण अपनी{" "}
            <Link href={`/kundali?${toBirthQuery(birth)}&tab=rudraksha`} className="font-semibold text-gold-bright hover:text-gold">
              कुंडली
            </Link>{" "}
            में देखें।
          </p>
        </>
      )}
    </ToolShell>
  );
}
