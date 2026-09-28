import type { Locale } from "@/lib/i18n/locale";

/** Horoscope reading text by transit house (1–12), in each language. */

export type SaturnKind = "sadeSatiRising" | "sadeSatiPeak" | "sadeSatiSetting" | "kantaka" | "ashtama" | "favourable" | "neutral";

interface HoroscopeText {
  moonHeadline: Record<number, string>;
  moonReading: Record<number, string>;
  jupiter: Record<number, string>;
  focus: Record<number, string>;
  saturnStatus: Record<SaturnKind, string>;
  saturnText: (kind: SaturnKind, house: number) => string;
}

const en: HoroscopeText = {
  moonHeadline: {
    1: "The Moon is in your sign — feelings run strong and you're at the centre of things.",
    2: "Money, family and what you say take the spotlight.",
    3: "A day for effort, courage and getting the word out.",
    4: "Home and inner comfort call; moods may run low.",
    5: "Creative and romantic, though the mind can wander.",
    6: "Good for clearing work, beating obstacles and routines.",
    7: "Relationships and partnerships are well supported.",
    8: "Chandrashtama — a sensitive day for caution and rest.",
    9: "Look to teachers, faith and the bigger picture.",
    10: "Work and reputation get a welcome push.",
    11: "One of the best days of the month for gains and friends.",
    12: "Expenses and fatigue; better for rest and reflection.",
  },
  moonReading: {
    1: "With the Moon moving through your own sign, your emotional energy is high and people notice you more than usual. It's a natural day to start something personal or put yourself forward. You may also feel things more intensely than they deserve, so pace yourself and don't let small slights set the mood.",
    2: "The Moon in your second house turns attention to money, food, family and speech. Conversations at home matter today, and a careful word goes further than a quick one. Keep an eye on impulse spending — it's a better day for budgeting than for big purchases.",
    3: "The Moon in your third house favours initiative. Calls, messages, short trips and anything that needs a bit of nerve go better than usual, and siblings or neighbours may play a part. If you've been putting off a difficult conversation or a pitch, today supports it.",
    4: "With the Moon in your fourth house, your mind turns to home, family and your own comfort. You may feel more tired or withdrawn than usual, and it's not the best day for major decisions about property or vehicles. Time at home and simple routines will do more good than pushing hard.",
    5: "The Moon in your fifth house brings creativity, play and matters of the heart forward, and children may need your attention. The mind can be restless, though — avoid speculation and snap decisions, and put the energy into something you enjoy making.",
    6: "The Moon in your sixth house is classically good for taking on problems. Pending work, health routines, paperwork and competition all go your way if you tackle them directly. It's a practical, productive day rather than a social one.",
    7: "The Moon in your seventh house supports partnerships of every kind. Time with your spouse or partner, meetings, negotiations and agreements are all favoured. You'll get more done with someone than alone today.",
    8: "The Moon is in your eighth house — Chandrashtama, the most sensitive Moon transit of the month. Avoid starting important ventures, signing major commitments or getting pulled into arguments, and take a little extra care while travelling. Keep to routine, rest well and let the day pass; it lasts only two and a half days.",
    9: "The Moon in your ninth house draws you towards teachers, elders, faith and long-range plans. Some things may be slower than you'd like, but guidance from someone older or wiser is worth seeking. A good day for study, prayer or planning a journey.",
    10: "The Moon in your tenth house lights up your work and public standing. Effort at work is noticed, and it's a good day to present results, meet seniors or take on responsibility. Keep a balance with home so that success at work doesn't cost you there.",
    11: "The Moon in your eleventh house is one of the most favourable transits of the month. Gains, good news, help from friends and progress towards your wishes are all supported. Reach out to your network — this is a day when asking tends to get a yes.",
    12: "The Moon in your twelfth house tends to bring expenses, tiredness and a wish to withdraw. It's a poor day for big launches but a good one for rest, spiritual practice, charity and quietly finishing old work. Watch your spending and get enough sleep.",
  },
  jupiter: {
    1: "Jupiter in your first house asks you to grow through change — a year of new beginnings that may unsettle your routine.",
    2: "Jupiter in your second house is a strong period for income, savings and family harmony.",
    3: "Jupiter in your third house asks for steady effort; results come, but more slowly than you'd like.",
    4: "Jupiter in your fourth house can bring domestic responsibilities and the need to look after your peace of mind.",
    5: "Jupiter in your fifth house favours children, learning, creativity and good judgement.",
    6: "Jupiter in your sixth house calls for care with health, debts and rivals — solid routines protect you.",
    7: "Jupiter in your seventh house supports marriage, partnerships and fruitful agreements.",
    8: "Jupiter in your eighth house is a period to move carefully with money and health and to avoid unnecessary risks.",
    9: "Jupiter in your ninth house brings luck, the support of mentors, and blessings through faith and travel.",
    10: "Jupiter in your tenth house brings changes at work; take responsibility, but avoid overcommitting.",
    11: "Jupiter in your eleventh house is one of its best placements — gains, fulfilled wishes and helpful friends.",
    12: "Jupiter in your twelfth house tends to raise expenses; spending on good causes and travel is well placed.",
  },
  focus: {
    1: "Self, health and personal initiative",
    2: "Money, family and speech",
    3: "Communication, courage and short trips",
    4: "Home, mother and peace of mind",
    5: "Creativity, children and romance",
    6: "Work, health routines and problem-solving",
    7: "Partnership and agreements",
    8: "Caution, rest and inner work",
    9: "Faith, mentors and long-range plans",
    10: "Career and reputation",
    11: "Gains, friends and wishes",
    12: "Rest, spending and spiritual practice",
  },
  saturnStatus: {
    sadeSatiRising: "Sade Sati — rising phase",
    sadeSatiPeak: "Sade Sati — peak phase",
    sadeSatiSetting: "Sade Sati — setting phase",
    kantaka: "Kantaka Shani",
    ashtama: "Ashtama Shani",
    favourable: "Favourable",
    neutral: "Neutral",
  },
  saturnText: (kind, house) => {
    const nth = `${house}${house === 1 ? "st" : house === 2 ? "nd" : house === 3 ? "rd" : "th"}`;
    switch (kind) {
      case "sadeSatiRising":
        return "Saturn in your twelfth house begins Sade Sati: expenses and restlessness may rise. Patience and discipline carry you through.";
      case "sadeSatiPeak":
        return "Saturn over your Moon sign is the peak of Sade Sati: a demanding, character-building stretch. Keep commitments modest and routines strong.";
      case "sadeSatiSetting":
        return "Saturn in your second house is the last phase of Sade Sati: watch finances and speech as the pressure gradually lifts.";
      case "kantaka":
        return "Saturn in your fourth house (Kantaka Shani) can weigh on home life and peace of mind; look after family and health.";
      case "ashtama":
        return "Saturn in your eighth house (Ashtama Shani) asks for caution with health, money and risk-taking.";
      case "favourable":
        return `Saturn in your ${nth} house is classically favourable — steady effort now brings lasting results.`;
      case "neutral":
        return `Saturn in your ${nth} house rewards patience and hard work over shortcuts.`;
    }
  },
};

const HI_ORDINAL = ["पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे", "सातवें", "आठवें", "नौवें", "दसवें", "ग्यारहवें", "बारहवें"];

const hi: HoroscopeText = {
  moonHeadline: {
    1: "चंद्रमा आपकी ही राशि में है — भावनाएँ प्रबल रहेंगी और आप सबके ध्यान में रहेंगे।",
    2: "धन, परिवार और आपकी वाणी आज केंद्र में रहेंगे।",
    3: "प्रयास, साहस और अपनी बात आगे रखने का दिन।",
    4: "घर और मन की शांति की ओर झुकाव; मन थोड़ा उदास रह सकता है।",
    5: "रचनात्मक और रोमांटिक दिन, हालाँकि मन भटक सकता है।",
    6: "अटके काम निपटाने, बाधाएँ पार करने और दिनचर्या सुधारने के लिए अच्छा।",
    7: "रिश्तों और साझेदारियों के लिए अनुकूल दिन।",
    8: "चंद्राष्टम — सावधानी और आराम का संवेदनशील दिन।",
    9: "गुरुजनों, आस्था और बड़े लक्ष्यों की ओर देखें।",
    10: "काम और प्रतिष्ठा को अच्छा बढ़ावा मिलेगा।",
    11: "लाभ और मित्रों के लिए महीने के सबसे अच्छे दिनों में से एक।",
    12: "खर्च और थकान; आराम और आत्म-चिंतन के लिए बेहतर।",
  },
  moonReading: {
    1: "चंद्रमा आपकी अपनी राशि से गुज़र रहा है, इसलिए आपकी भावनात्मक ऊर्जा ऊँची है और लोग आप पर सामान्य से अधिक ध्यान देंगे। कोई निजी काम शुरू करने या खुद को आगे रखने के लिए यह स्वाभाविक दिन है। छोटी-छोटी बातें भी ज़्यादा चुभ सकती हैं, इसलिए संयम रखें और उन्हें अपना मूड तय न करने दें।",
    2: "दूसरे भाव में चंद्रमा धन, भोजन, परिवार और वाणी की ओर ध्यान ले जाता है। आज घर की बातचीत मायने रखती है, और सोच-समझकर कहा गया शब्द जल्दबाज़ी से कहीं ज़्यादा असर करेगा। अचानक खर्च से बचें — बड़ी खरीदारी की बजाय बजट बनाने के लिए यह बेहतर दिन है।",
    3: "तीसरे भाव में चंद्रमा पहल करने का साथ देता है। फ़ोन, संदेश, छोटी यात्राएँ और हिम्मत माँगने वाले काम सामान्य से बेहतर होंगे, और भाई-बहन या पड़ोसी भी भूमिका निभा सकते हैं। यदि कोई कठिन बातचीत या प्रस्ताव टाल रहे थे, तो आज का दिन उसके पक्ष में है।",
    4: "चौथे भाव में चंद्रमा होने से मन घर, परिवार और अपने आराम की ओर जाता है। आप सामान्य से अधिक थके या अकेले रहना चाहेंगे, और संपत्ति या वाहन से जुड़े बड़े निर्णयों के लिए यह सबसे अच्छा दिन नहीं है। ज़ोर लगाने की बजाय घर पर समय और सरल दिनचर्या अधिक लाभ देगी।",
    5: "पाँचवें भाव में चंद्रमा रचनात्मकता, मनोरंजन और दिल की बातों को आगे लाता है, और बच्चों को आपके ध्यान की ज़रूरत हो सकती है। मन बेचैन रह सकता है — सट्टा और जल्दबाज़ी के फ़ैसलों से बचें, और ऊर्जा किसी ऐसे काम में लगाएँ जिसे बनाने में आपको आनंद आता हो।",
    6: "छठे भाव में चंद्रमा शास्त्रों के अनुसार समस्याओं से निपटने के लिए अच्छा है। अटके काम, सेहत की दिनचर्या, कागज़ी काम और प्रतिस्पर्धा — सीधे सामना करेंगे तो सब आपके पक्ष में जाएगा। यह मेल-मिलाप से ज़्यादा व्यावहारिक और उत्पादक दिन है।",
    7: "सातवें भाव में चंद्रमा हर तरह की साझेदारी का साथ देता है। जीवनसाथी या साथी के साथ समय, बैठकें, बातचीत और समझौते — सब अनुकूल हैं। आज अकेले की बजाय किसी के साथ मिलकर अधिक काम होगा।",
    8: "चंद्रमा आपके आठवें भाव में है — चंद्राष्टम, महीने का सबसे संवेदनशील चंद्र गोचर। महत्वपूर्ण काम शुरू करने, बड़ी प्रतिबद्धताओं और विवादों से बचें, और यात्रा में थोड़ी अधिक सावधानी रखें। दिनचर्या बनाए रखें, पूरा आराम करें और दिन को शांति से गुज़रने दें; यह केवल ढाई दिन रहता है।",
    9: "नौवें भाव में चंद्रमा आपको गुरुजनों, बड़ों, आस्था और दूरगामी योजनाओं की ओर ले जाता है। कुछ काम अपेक्षा से धीमे हो सकते हैं, पर किसी अनुभवी व्यक्ति की सलाह लेना लाभकारी रहेगा। पढ़ाई, पूजा-पाठ या यात्रा की योजना के लिए अच्छा दिन।",
    10: "दसवें भाव में चंद्रमा आपके काम और सामाजिक प्रतिष्ठा को चमकाता है। काम में की गई मेहनत पर ध्यान जाएगा; नतीजे प्रस्तुत करने, वरिष्ठों से मिलने या ज़िम्मेदारी लेने के लिए अच्छा दिन है। घर के साथ संतुलन बनाए रखें ताकि काम की सफलता की कीमत वहाँ न चुकानी पड़े।",
    11: "ग्यारहवें भाव में चंद्रमा महीने के सबसे शुभ गोचरों में से एक है। लाभ, अच्छी ख़बर, मित्रों की मदद और इच्छाओं की ओर प्रगति — सब अनुकूल हैं। अपने परिचितों से संपर्क करें — आज माँगने पर अक्सर 'हाँ' मिलती है।",
    12: "बारहवें भाव में चंद्रमा खर्च, थकान और एकांत की इच्छा ला सकता है। बड़े काम शुरू करने के लिए यह ठीक दिन नहीं, पर आराम, साधना, दान और पुराने काम चुपचाप पूरे करने के लिए अच्छा है। खर्च पर नज़र रखें और पूरी नींद लें।",
  },
  jupiter: {
    1: "पहले भाव में गुरु बदलाव के ज़रिए आगे बढ़ने को कहते हैं — नई शुरुआत का वर्ष, जो आपकी दिनचर्या को थोड़ा हिला सकता है।",
    2: "दूसरे भाव में गुरु आय, बचत और पारिवारिक सौहार्द के लिए मज़बूत समय है।",
    3: "तीसरे भाव में गुरु लगातार प्रयास माँगते हैं; परिणाम मिलेंगे, पर अपेक्षा से धीरे।",
    4: "चौथे भाव में गुरु घरेलू ज़िम्मेदारियाँ और मन की शांति का ध्यान रखने की ज़रूरत ला सकते हैं।",
    5: "पाँचवें भाव में गुरु संतान, शिक्षा, रचनात्मकता और सही निर्णय के लिए शुभ हैं।",
    6: "छठे भाव में गुरु सेहत, कर्ज़ और विरोधियों के मामले में सावधानी माँगते हैं — अच्छी दिनचर्या आपकी रक्षा करेगी।",
    7: "सातवें भाव में गुरु विवाह, साझेदारी और लाभदायक समझौतों का साथ देते हैं।",
    8: "आठवें भाव में गुरु धन और स्वास्थ्य में सावधानी से चलने और अनावश्यक जोखिम से बचने का समय है।",
    9: "नौवें भाव में गुरु भाग्य, गुरुजनों का सहयोग, और आस्था व यात्रा से आशीर्वाद लाते हैं।",
    10: "दसवें भाव में गुरु काम में बदलाव लाते हैं; ज़िम्मेदारी लें, पर ज़रूरत से ज़्यादा वादे न करें।",
    11: "ग्यारहवें भाव में गुरु अपनी सबसे अच्छी स्थितियों में से एक में हैं — लाभ, इच्छापूर्ति और सहायक मित्र।",
    12: "बारहवें भाव में गुरु खर्च बढ़ा सकते हैं; अच्छे कामों और यात्रा पर खर्च सार्थक रहेगा।",
  },
  focus: {
    1: "स्वयं, स्वास्थ्य और व्यक्तिगत पहल",
    2: "धन, परिवार और वाणी",
    3: "संवाद, साहस और छोटी यात्राएँ",
    4: "घर, माता और मन की शांति",
    5: "रचनात्मकता, संतान और प्रेम",
    6: "काम, सेहत की दिनचर्या और समस्याओं का हल",
    7: "साझेदारी और समझौते",
    8: "सावधानी, आराम और आत्म-चिंतन",
    9: "आस्था, गुरुजन और दूरगामी योजनाएँ",
    10: "करियर और प्रतिष्ठा",
    11: "लाभ, मित्र और इच्छाएँ",
    12: "आराम, खर्च और साधना",
  },
  saturnStatus: {
    sadeSatiRising: "साढ़े साती — पहला चरण",
    sadeSatiPeak: "साढ़े साती — मध्य चरण",
    sadeSatiSetting: "साढ़े साती — अंतिम चरण",
    kantaka: "कंटक शनि",
    ashtama: "अष्टम शनि",
    favourable: "शुभ",
    neutral: "सामान्य",
  },
  saturnText: (kind, house) => {
    switch (kind) {
      case "sadeSatiRising":
        return "बारहवें भाव में शनि से साढ़े साती शुरू होती है: खर्च और बेचैनी बढ़ सकती है। धैर्य और अनुशासन से यह समय पार होगा।";
      case "sadeSatiPeak":
        return "आपकी चंद्र राशि पर शनि साढ़े साती का मध्य चरण है: कठिन पर चरित्र गढ़ने वाला समय। वादे सीमित रखें और दिनचर्या मज़बूत।";
      case "sadeSatiSetting":
        return "दूसरे भाव में शनि साढ़े साती का अंतिम चरण है: दबाव धीरे-धीरे कम होगा, धन और वाणी पर ध्यान रखें।";
      case "kantaka":
        return "चौथे भाव में शनि (कंटक शनि) घर और मन की शांति पर भारी पड़ सकते हैं; परिवार और सेहत का ध्यान रखें।";
      case "ashtama":
        return "आठवें भाव में शनि (अष्टम शनि) स्वास्थ्य, धन और जोखिम के मामलों में सावधानी माँगते हैं।";
      case "favourable":
        return `${HI_ORDINAL[house - 1]} भाव में शनि शास्त्रों के अनुसार शुभ हैं — अभी का लगातार प्रयास स्थायी फल देगा।`;
      case "neutral":
        return `${HI_ORDINAL[house - 1]} भाव में शनि शॉर्टकट की बजाय धैर्य और मेहनत का फल देते हैं।`;
    }
  },
};

export function horoscopeText(locale: Locale): HoroscopeText {
  return locale === "hi" ? hi : en;
}
