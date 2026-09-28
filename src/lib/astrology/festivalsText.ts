import type { Locale } from "@/lib/i18n/locale";
import { monthTerm } from "@/lib/i18n/terms";
import type { Observance } from "./festivals";

/** Hindi names and descriptions for festivals, keyed by slug. */
const FESTIVALS_HI: Record<string, { name: string; description: string }> = {
  "makar-sankranti": { name: "मकर संक्रांति · पोंगल", description: "सूर्य मकर राशि में प्रवेश कर उत्तरायण होते हैं — पतंगबाज़ी, तिल-गुड़, पवित्र स्नान और पोंगल के साथ मनाया जाता है।" },
  "vasant-panchami": { name: "वसंत पंचमी", description: "वसंत ऋतु का स्वागत और विद्या व कला की देवी सरस्वती की पूजा। इस दिन बच्चों का विद्यारंभ भी कराया जाता है।" },
  "maha-shivaratri": { name: "महाशिवरात्रि", description: "भगवान शिव की महान रात्रि — उपवास, रात्रि जागरण और शिवलिंग की पूजा, विशेषकर निशीथ काल (मध्यरात्रि) में।" },
  "holika-dahan": { name: "होलिका दहन", description: "होली से पहले पूर्णिमा की शाम होलिका जलाई जाती है — भक्त प्रह्लाद की भक्ति की बुराई पर विजय का प्रतीक।" },
  holi: { name: "होली", description: "रंगों का त्योहार, होलिका दहन की अगली सुबह मनाया जाता है।" },
  "ugadi-gudi-padwa": { name: "उगादि / गुड़ी पड़वा · चैत्र नवरात्रि आरंभ", description: "भारत के बड़े हिस्से में हिंदू नववर्ष, और चैत्र नवरात्रि का पहला दिन।" },
  "ram-navami": { name: "राम नवमी", description: "भगवान श्रीराम का जन्मोत्सव, मध्याह्न में मनाया जाता है — उनके जन्म का समय।" },
  "hanuman-jayanti": { name: "हनुमान जयंती", description: "हनुमान जी का जन्मोत्सव — हनुमान चालीसा, मंदिर दर्शन और सिंदूर चढ़ाकर मनाया जाता है।" },
  "akshaya-tritiya": { name: "अक्षय तृतीया", description: "अत्यंत शुभ दिन जिसका पुण्य कभी क्षय नहीं होता — सोना खरीदने और नए काम शुरू करने के लिए प्रसिद्ध।" },
  "guru-purnima": { name: "गुरु पूर्णिमा", description: "अपने गुरुओं और शिक्षकों को नमन करने का दिन, और महर्षि वेदव्यास की जयंती।" },
  "nag-panchami": { name: "नाग पंचमी", description: "नाग देवताओं की पूजा; कालसर्प दोष से राहत के लिए भी परंपरागत रूप से मनाई जाती है।" },
  "raksha-bandhan": { name: "रक्षाबंधन", description: "बहनें भाइयों की कलाई पर राखी बाँधती हैं — रक्षा और स्नेह के बंधन का उत्सव।" },
  janmashtami: { name: "कृष्ण जन्माष्टमी", description: "भगवान श्रीकृष्ण का जन्मोत्सव, मध्यरात्रि में उपवास, भजन और बाल गोपाल का झूला झुलाकर मनाया जाता है।" },
  "ganesh-chaturthi": { name: "गणेश चतुर्थी", description: "भगवान गणेश का जन्मोत्सव — मध्याह्न में गणपति की स्थापना और दस दिनों तक पूजा।" },
  "sharad-navratri": { name: "शारदीय नवरात्रि आरंभ", description: "माँ दुर्गा के नौ रूपों की नौ रातों की पूजा, घटस्थापना से आरंभ।" },
  dussehra: { name: "दशहरा (विजयादशमी)", description: "रावण पर श्रीराम की और महिषासुर पर माँ दुर्गा की विजय — बुराई पर अच्छाई की जीत।" },
  "karva-chauth": { name: "करवा चौथ", description: "विवाहित स्त्रियाँ पति की लंबी आयु के लिए सूर्योदय से चंद्रोदय तक व्रत रखती हैं और चाँद देखकर व्रत खोलती हैं।" },
  dhanteras: { name: "धनतेरस", description: "दीपावली का पहला दिन, भगवान धन्वंतरि और लक्ष्मी जी को समर्पित — सोना, चाँदी या बर्तन खरीदने की परंपरा।" },
  diwali: { name: "दीवाली (लक्ष्मी पूजा)", description: "रोशनी का त्योहार। लक्ष्मी पूजा कार्तिक अमावस्या की शाम प्रदोष काल में की जाती है।" },
  "govardhan-puja": { name: "गोवर्धन पूजा", description: "श्रीकृष्ण द्वारा गोवर्धन पर्वत उठाने की स्मृति में अन्नकूट का भोग लगाया जाता है।" },
  "bhai-dooj": { name: "भाई दूज", description: "दीपावली पर्व का अंतिम दिन, जब बहनें भाइयों को तिलक कर उनकी लंबी आयु की प्रार्थना करती हैं।" },
  "chhath-puja": { name: "छठ पूजा", description: "सूर्य देव और छठी मैया की उपासना, डूबते और उगते सूर्य को अर्घ्य देकर।" },
  "dev-uthani-ekadashi": { name: "देवउठनी एकादशी", description: "भगवान विष्णु चार माह की योगनिद्रा से जागते हैं — चातुर्मास समाप्त होता है और विवाह का मौसम फिर शुरू होता है।" },
  "kartik-purnima": { name: "कार्तिक पूर्णिमा · गुरु नानक जयंती", description: "पवित्र स्नान और दीपदान (देव दीपावली) की पूर्णिमा, और गुरु नानक देव जी की जयंती।" },
};

const EKADASHI_HI: Record<string, string> = {
  Kamada: "कामदा", Mohini: "मोहिनी", Nirjala: "निर्जला", Devshayani: "देवशयनी", "Shravana Putrada": "श्रावण पुत्रदा",
  Parivartini: "परिवर्तिनी", Papankusha: "पापांकुशा", Devutthana: "देवउठनी", Mokshada: "मोक्षदा", "Pausha Putrada": "पौष पुत्रदा",
  Jaya: "जया", Amalaki: "आमलकी", Varuthini: "वरूथिनी", Apara: "अपरा", Yogini: "योगिनी", Kamika: "कामिका", Aja: "अजा",
  Indira: "इंदिरा", Rama: "रमा", Utpanna: "उत्पन्ना", Saphala: "सफला", Shattila: "षटतिला", Vijaya: "विजया",
  Papmochani: "पापमोचिनी", Padmini: "पद्मिनी", Parama: "परमा",
};

export function observanceName(o: Observance, locale: Locale): string {
  if (locale === "en") return o.name;
  const hi = FESTIVALS_HI[o.slug];
  if (hi) return hi.name;
  switch (o.category) {
    case "Ekadashi":
      return `${EKADASHI_HI[o.name.replace(/ Ekadashi$/, "")] ?? o.name.replace(/ Ekadashi$/, "")} एकादशी`;
    case "Purnima":
      return `${monthTerm(locale, o.month)} पूर्णिमा`;
    case "Amavasya":
      return `${monthTerm(locale, o.month)} अमावस्या`;
    case "Sankashti Chaturthi":
      return "संकष्टी चतुर्थी";
    case "Pradosh Vrat":
      return o.name.includes("Shukla") ? "प्रदोष व्रत (शुक्ल)" : "प्रदोष व्रत (कृष्ण)";
    default:
      return o.name;
  }
}

export function observanceDescription(o: Observance, locale: Locale): string | undefined {
  return locale === "hi" ? (FESTIVALS_HI[o.slug]?.description ?? o.description) : o.description;
}
