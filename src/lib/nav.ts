export interface NavItem {
  href: string;
  label: string;
  description?: string;
  labelHi?: string;
  descriptionHi?: string;
}

export const LEARN_LINKS: NavItem[] = [
  { href: "/learn/planets", label: "Planets", description: "The nine grahas and what each governs", labelHi: "ग्रह", descriptionHi: "नवग्रह और उनके कारकत्व" },
  { href: "/learn/signs", label: "Signs", description: "The twelve rashis of the sidereal zodiac", labelHi: "राशियाँ", descriptionHi: "निरयण राशिचक्र की बारह राशियाँ" },
  { href: "/learn/houses", label: "Houses", description: "The twelve bhavas and their life areas", labelHi: "भाव", descriptionHi: "बारह भाव और जीवन के क्षेत्र" },
  { href: "/learn/nakshatras", label: "Nakshatras", description: "The 27 lunar mansions and their lords", labelHi: "नक्षत्र", descriptionHi: "27 नक्षत्र और उनके स्वामी" },
  { href: "/learn/yogas", label: "Yogas & Doshas", description: "Classical combinations and afflictions", labelHi: "योग और दोष", descriptionHi: "शास्त्रीय योग और दोष" },
  { href: "/learn/divisional-charts", label: "Divisional Charts", description: "Navamsa, Dasamsa and the other vargas", labelHi: "वर्ग कुंडलियाँ", descriptionHi: "नवांश, दशमांश और अन्य वर्ग" },
  { href: "/learn/dasha-system", label: "Dasha System", description: "How Vimshottari periods unfold", labelHi: "दशा पद्धति", descriptionHi: "विंशोत्तरी दशा कैसे चलती है" },
  { href: "/learn/compatibility", label: "Compatibility", description: "Matching for love, business and friendship", labelHi: "अनुकूलता", descriptionHi: "प्रेम, व्यापार और मित्रता के लिए मिलान" },
  { href: "/learn/gemstones", label: "Gemstones", description: "The navaratna and how to choose one safely", labelHi: "रत्न", descriptionHi: "नवरत्न और सही रत्न का चुनाव" },
  { href: "/learn/glossary", label: "Glossary", description: "Jyotish terms, explained plainly", labelHi: "शब्दकोश", descriptionHi: "ज्योतिष के शब्द, सरल भाषा में" },
];

export const KUNDLI_LINKS: NavItem[] = [
  { href: "/kundali", label: "Free Kundli", description: "Your full Vedic birth chart, dashas and remedies", labelHi: "फ्री कुंडली", descriptionHi: "पूरी वैदिक जन्म कुंडली, दशा और उपाय" },
  { href: "/matching", label: "Kundli Matching", description: "For marriage, love, business and friendship", labelHi: "कुंडली मिलान", descriptionHi: "विवाह, प्रेम, व्यापार और मित्रता के लिए" },
  { href: "/numerology", label: "Numerology", description: "Moolank, Bhagyank and name number", labelHi: "अंक ज्योतिष", descriptionHi: "मूलांक, भाग्यांक और नामांक" },
  { href: "/sade-sati", label: "Sade Sati Check", description: "Your Sade Sati and Dhaiya dates for life", labelHi: "साढ़े साती जाँच", descriptionHi: "जीवन भर की साढ़े साती और ढैया" },
  { href: "/nakshatra-finder", label: "Nakshatra Finder", description: "Your birth star, pada and name letters", labelHi: "नक्षत्र खोजें", descriptionHi: "जन्म नक्षत्र, पद और नामाक्षर" },
  { href: "/rectification", label: "Birth Time Rectification", description: "Find your exact birth time from life events", labelHi: "जन्म समय शोधन", descriptionHi: "जीवन की घटनाओं से सही जन्म समय" },
  { href: "/varshphal", label: "Varshphal", description: "Your annual solar-return chart", labelHi: "वर्षफल", descriptionHi: "आपकी वार्षिक कुंडली" },
  { href: "/learn/gemstones", label: "Gemstones", description: "Which navaratna suits which planet", labelHi: "रत्न", descriptionHi: "कौन सा रत्न किस ग्रह के लिए" },
];

export const HOROSCOPE_LINKS: NavItem[] = [
  { href: "/horoscope", label: "Daily Rashifal", description: "Today's horoscope by Moon or Sun sign, with the reasons", labelHi: "दैनिक राशिफल", descriptionHi: "चंद्र या सूर्य राशि से आज का राशिफल, कारण सहित" },
  { href: "/horoscope/personal", label: "Personal Daily Horoscope", description: "Tarabala, Chandrabala and transits from your own chart", labelHi: "व्यक्तिगत राशिफल", descriptionHi: "आपकी कुंडली से ताराबल, चंद्रबल और गोचर" },
  { href: "/horoscope/aries/weekly", label: "Weekly & Monthly", description: "Longer readings for every sign", labelHi: "साप्ताहिक और मासिक", descriptionHi: "हर राशि का लंबी अवधि का फल" },
];

export const PANCHANG_LINKS: NavItem[] = [
  { href: "/panchang", label: "Today's Panchang", description: "Tithi, nakshatra, Rahu Kaal and Choghadiya", labelHi: "आज का पंचांग", descriptionHi: "तिथि, नक्षत्र, राहु काल और चौघड़िया" },
  { href: "/festivals", label: "Festival Calendar", description: "Festivals, Ekadashi and vrat dates", labelHi: "त्योहार कैलेंडर", descriptionHi: "त्योहार, एकादशी और व्रत की तिथियाँ" },
  { href: "/muhurat", label: "Shubh Muhurat", description: "Good days for marriage, griha pravesh and more", labelHi: "शुभ मुहूर्त", descriptionHi: "विवाह, गृह प्रवेश आदि के शुभ दिन" },
];

export interface NavGroup {
  label: string;
  labelHi: string;
  blurbHi: string;
  /** Path prefixes that mark the group active. */
  matches: string[];
  blurb: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

export const PRIMARY_NAV: NavEntry[] = [
  { label: "Kundli", labelHi: "कुंडली", blurbHi: "कुंडली, मिलान और अंक ज्योतिष — असली खगोल गणना से।", matches: ["/kundali", "/matching", "/numerology"], blurb: "Charts, matching and numerology — computed from real astronomy.", items: KUNDLI_LINKS },
  { label: "Horoscope", labelHi: "राशिफल", blurbHi: "राशि से या आपकी अपनी कुंडली से — हर फल का कारण सहित।", matches: ["/horoscope"], blurb: "By sign or from your own chart — every reading with its reasons.", items: HOROSCOPE_LINKS },
  { label: "Panchang", labelHi: "पंचांग", blurbHi: "किसी भी दिन, त्योहार या अवसर के लिए हिंदू पंचांग।", matches: ["/panchang", "/festivals", "/muhurat"], blurb: "The Hindu calendar for any day, festival or occasion.", items: PANCHANG_LINKS },
  { label: "Learn", labelHi: "सीखें", blurbHi: "आपकी कुंडली के हर पहलू की सरल जानकारी।", matches: ["/learn"], blurb: "Plain-language guides to every building block of your kundli.", items: [{ href: "/learn", label: "All topics", description: "The full reference library", labelHi: "सभी विषय", descriptionHi: "पूरी संदर्भ लाइब्रेरी" }, ...LEARN_LINKS] },
  { href: "/consultation", label: "Consultation", labelHi: "परामर्श" },
];

/** Shown in the mobile menu and footer only, to keep the desktop bar uncrowded. */
export const SECONDARY_LINKS: NavItem[] = [
  { href: "/blog", label: "Blog", labelHi: "ब्लॉग" },
  { href: "/about", label: "About", labelHi: "हमारे बारे में" },
];

export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
