import type { Metadata } from "next";
import { Suspense } from "react";
import KundaliForm from "@/components/KundaliForm";
import KundaliIntro from "@/components/KundaliIntro";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "मुफ़्त कुंडली — जन्म कुंडली बनाएँ",
  description: "ग्रह स्थिति, नक्षत्र, दशा और दोष सहित अपनी मुफ़्त वैदिक जन्म कुंडली बनाएँ।",
  alternates: { ...languageAlternates("/kundali"), canonical: "/hi/kundali" },
};

export default function HindiKundaliPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl">
              <KundaliIntro />
              <div className="card-edge mt-14 h-[444px] rounded-3xl md:h-[346px]" aria-hidden="true" />
            </div>
          }
        >
          <KundaliForm />
        </Suspense>
      </div>
    </section>
  );
}
