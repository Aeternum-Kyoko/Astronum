import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoShuMaker from "@/components/LoShuMaker";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "लो शु ग्रिड — जन्म तिथि से विस्तृत लो शु विश्लेषण",
  description: "जन्म तिथि से अपनी लो शु ग्रिड बनाएँ — मूलांक, भाग्यांक और कुआ अंक सहित। हर अंक, दोहराए और लुप्त अंकों के उपाय, आठ तल और राजयोग, और आपकी शुभ दिशाओं का विस्तृत फल।",
  alternates: { ...languageAlternates("/lo-shu"), canonical: "/hi/lo-shu" },
};

export default function HindiLoShuPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">अंक ज्योतिष · लो शु ग्रिड</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">आपकी लो शु ग्रिड, पूरे विस्तार से</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            प्राचीन 3×3 जादुई वर्ग, जिसकी हर पंक्ति, स्तंभ और विकर्ण का योग 15 है। आपकी जन्म तिथि इसे भरती है — और जो अंक आपके पास हैं, दोहराए जाते
            हैं या लुप्त हैं, वे आपकी शक्तियाँ, सबक और उन्हें संतुलित करने के सरल उपाय बताते हैं।
          </p>
        </header>
        <div className="mt-10">
          <Suspense>
            <LoShuMaker locale="hi" />
          </Suspense>
        </div>
        <section className="card-edge mt-10 rounded-2xl p-6 text-sm leading-relaxed text-muted">
          <h2 className="text-lg font-bold text-cream">ग्रिड कैसे बनती है</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>जन्म तिथि का हर शून्य-रहित अंक अपने खाने में रखा जाता है (4 9 2 / 3 5 7 / 8 1 6)।</li>
            <li>भारतीय लो शु अंक ज्योतिष की तरह मूलांक (जन्म दिन) और भाग्यांक (पूरी तिथि) जोड़े जाते हैं; लिंग बताने पर कुआ अंक भी।</li>
            <li>हर खाना एक ग्रह, एक तत्व और घर की एक दिशा का है — इसीलिए लुप्त अंक उन्हीं दिशाओं से संतुलित किए जाते हैं।</li>
          </ul>
          <p className="mt-4">
            मूलांक, भाग्यांक और नामांक के लिए{" "}
            <Link href="/numerology" className="font-semibold text-gold-bright hover:text-gold">
              अंक ज्योतिष कैलकुलेटर
            </Link>{" "}
            देखें।
          </p>
        </section>
      </div>
    </section>
  );
}
