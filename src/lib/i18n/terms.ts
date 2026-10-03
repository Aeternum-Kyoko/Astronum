import type { Locale } from "./locale";

/**
 * Hindi names for the astrological terms the engine produces in English
 * (sign, planet, nakshatra, tithi, yoga, karana, weekday, month…). Compound
 * names like "Krishna Pratipada" are translated word by word.
 */
const HI: Record<string, string> = {
  // Signs
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या",
  Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन",
  // Planets
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु",
  // Nakshatras
  Ashwini: "अश्विनी", Bharani: "भरणी", Krittika: "कृत्तिका", Rohini: "रोहिणी", Mrigashira: "मृगशिरा", Ardra: "आर्द्रा",
  Punarvasu: "पुनर्वसु", Pushya: "पुष्य", Ashlesha: "आश्लेषा", Magha: "मघा", "Purva Phalguni": "पूर्वा फाल्गुनी",
  "Uttara Phalguni": "उत्तरा फाल्गुनी", Hasta: "हस्त", Chitra: "चित्रा", Swati: "स्वाति", Vishakha: "विशाखा",
  Anuradha: "अनुराधा", Jyeshtha: "ज्येष्ठा", Mula: "मूल", "Purva Ashadha": "पूर्वाषाढ़ा", "Uttara Ashadha": "उत्तराषाढ़ा",
  Shravana: "श्रवण", Dhanishta: "धनिष्ठा", Shatabhisha: "शतभिषा", "Purva Bhadrapada": "पूर्वा भाद्रपद",
  "Uttara Bhadrapada": "उत्तरा भाद्रपद", Revati: "रेवती",
  // Tithis and paksha
  Shukla: "शुक्ल", Krishna: "कृष्ण", Pratipada: "प्रतिपदा", Dwitiya: "द्वितीया", Tritiya: "तृतीया", Chaturthi: "चतुर्थी",
  Panchami: "पंचमी", Shashthi: "षष्ठी", Saptami: "सप्तमी", Ashtami: "अष्टमी", Navami: "नवमी", Dashami: "दशमी",
  Ekadashi: "एकादशी", Dwadashi: "द्वादशी", Trayodashi: "त्रयोदशी", Chaturdashi: "चतुर्दशी", Purnima: "पूर्णिमा", Amavasya: "अमावस्या",
  // Nitya yogas
  Vishkambha: "विष्कुम्भ", Priti: "प्रीति", Ayushman: "आयुष्मान", Saubhagya: "सौभाग्य", Shobhana: "शोभन", Atiganda: "अतिगण्ड",
  Sukarma: "सुकर्मा", Dhriti: "धृति", Shula: "शूल", Ganda: "गण्ड", Vriddhi: "वृद्धि", Dhruva: "ध्रुव", Vyaghata: "व्याघात",
  Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि", Vyatipata: "व्यतीपात", Variyana: "वरीयान", Parigha: "परिघ", Shiva: "शिव",
  Siddha: "सिद्ध", Sadhya: "साध्य", Shubha: "शुभ", Brahma: "ब्रह्म", Indra: "इन्द्र", Vaidhriti: "वैधृति",
  // Karanas
  Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल", Gara: "गर", Vanija: "वणिज", Vishti: "विष्टि (भद्रा)",
  Shakuni: "शकुनि", Chatushpada: "चतुष्पद", Naga: "नाग", Kimstughna: "किंस्तुघ्न",
  // Weekdays
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार", Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
  // Choghadiya
  Amrit: "अमृत", Shubh: "शुभ", Labh: "लाभ", Char: "चर", Udveg: "उद्वेग", Kaal: "काल", Rog: "रोग",
  // Lunar months
  Chaitra: "चैत्र", Vaishakha: "वैशाख", Ashadha: "आषाढ़", Bhadrapada: "भाद्रपद", Ashwin: "आश्विन",
  Kartika: "कार्तिक", Margashirsha: "मार्गशीर्ष", Pausha: "पौष", Phalguna: "फाल्गुन", Adhika: "अधिक",
  // Tones and statuses
  Favourable: "शुभ", Mixed: "मिश्रित", Challenging: "चुनौतीपूर्ण",
  // Dignities
  Exalted: "उच्च", Debilitated: "नीच", Moolatrikona: "मूलत्रिकोण", "Own Sign": "स्वराशि", "Friend's Sign": "मित्र राशि",
  "Enemy's Sign": "शत्रु राशि", "Neutral Sign": "सम राशि",
  // Verdicts and grades
  Strong: "बलवान", Balanced: "संतुलित", Weak: "कमज़ोर", Excellent: "उत्कृष्ट", Good: "अच्छा", Average: "सामान्य", "Very weak": "बहुत कमज़ोर",
  Difficult: "कठिन", Moderate: "मध्यम", Mitigated: "शमित", Supportive: "सहायक", Demanding: "कठिन",
  // Dasha levels
  Mahadasha: "महादशा", Antardasha: "अंतर्दशा", Pratyantardasha: "प्रत्यंतर दशा",
};

// Three month names are spelled differently from the nakshatras they share an English name with.
const HI_MONTH_OVERRIDES: Record<string, string> = { Shravana: "श्रावण", Magha: "माघ", Jyeshtha: "ज्येष्ठ" };

export function term(locale: Locale, english: string): string {
  if (locale === "en") return english;
  if (HI[english]) return HI[english];
  // Compound terms ("Krishna Pratipada", "Adhika Jyeshtha"): translate each word, keeping unknown words.
  return english
    .split(" ")
    .map((w) => HI[w] ?? w)
    .join(" ");
}

/** Lunar month names (Shravana, Magha and Jyeshtha differ from the nakshatra spellings). */
export function monthTerm(locale: Locale, english: string): string {
  if (locale === "en") return english;
  return english
    .split(" ")
    .map((w) => HI_MONTH_OVERRIDES[w] ?? HI[w] ?? w)
    .join(" ");
}
