import type { Metadata } from "next";
import Link from "next/link";
import PalmReader from "@/components/PalmReader";
import { languageAlternates } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "हस्तरेखा — कैमरे से लाइव हथेली पढ़ें",
  description: "हथेली कैमरे को दिखाएँ और हृदय, मस्तिष्क, जीवन व भाग्य रेखा को लाइव बनते देखें; फिर रेखाओं, नौ पर्वतों और उनके चिह्नों, हाथ के आकार और उँगलियों का पूरा हस्त सामुद्रिक फल पाएँ — आपकी कुंडली से मिलाकर। सब आपके डिवाइस पर।",
  alternates: { ...languageAlternates("/palmistry"), canonical: "/hi/palmistry" },
};

export default function HindiPalmistryPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-gold-bright">हस्तरेखा · हस्त सामुद्रिक शास्त्र</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-cream md:text-5xl">अपनी हथेली पढ़ें, लाइव</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            खुली हथेली कैमरे को दिखाएँ। हाथ हिलाते समय रेखाएँ बनती दिखती हैं और कई फ़्रेम से स्थिर होती हैं; तस्वीर साफ़ और समान रोशनी में होते
            ही फ़ोटो अपने-आप ली जाती है और आपकी रेखाएँ, पर्वत, हाथ का आकार और उँगलियाँ पढ़ी जाती हैं।
          </p>
        </header>
        <div className="mt-10">
          <PalmReader locale="hi" />
        </div>
        <section className="card-edge mt-10 rounded-2xl p-6 text-sm leading-relaxed text-muted">
          <h2 className="text-lg font-bold text-cream">सबसे सटीक फल के लिए</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>तेज़, समान रोशनी रखें — बगल की खिड़की से आती रोशनी रेखाएँ सबसे अच्छी दिखाती है। सामने से फ़्लैश न करें।</li>
            <li>हथेली सपाट और उँगलियाँ सीधी रखें, फ़्रेम का अधिकांश भाग भरते हुए — हाथ मुड़ा या तिरछा हो तो ऐप बता देगा।</li>
            <li>पर्वतों के लिए हर उभार को हल्का दबाकर सपाट, सामान्य या उभरा चुनें — केवल फ़ोटो से पर्वत की ऊँचाई नहीं दिखती।</li>
            <li>जिस हाथ से आप लिखते हैं वह आपके बनाए जीवन को दिखाता है, और दूसरा हाथ जन्म से मिले स्वभाव को।</li>
          </ul>
          <p className="mt-4">
            हस्तरेखा आत्म-चिंतन की एक पारंपरिक कला है, चिकित्सा या वित्तीय मार्गदर्शन नहीं। समय और विस्तार के लिए आपकी{" "}
            <Link href="/kundali" className="font-semibold text-gold-bright hover:text-gold">
              जन्म कुंडली
            </Link>{" "}
            कहीं आगे जाती है।
          </p>
        </section>
      </div>
    </section>
  );
}
