import { NAMAKSHAR } from "@/lib/astrology/namakshar";
import { NAKSHATRAS } from "@/lib/astrology/constants";

/**
 * Popular Indian names with their meanings, matched to a nakshatra pada by
 * the traditional first syllable (namakshar).
 */

export interface BabyName {
  name: string;
  gender: "Boy" | "Girl";
  meaning: string;
}

const RAW = `
Chulbul|B|playful;Chetan|B|consciousness;Chetana|G|awareness;Chhavi|G|radiance;Chhaya|G|shade, shelter;Chodhary|B|leader
Lakshay|B|aim, target;Lakshmi|G|goddess of wealth;Lavanya|G|grace;Lata|G|creeper;Lalit|B|beautiful;Lavish|B|abundant;Laksh|B|target
Likhit|B|written;Lipika|G|script;Lipi|G|writing;Lila|G|divine play
Lucky|B|fortunate;Lunar|G|of the Moon;Luv|B|son of Rama
Leela|G|divine play;Lekha|G|writing;Lekh|B|writing
Lokesh|B|lord of the world;Lochan|B|eyes;Lohit|B|red;Lopa|G|wife of sage Agastya
Aarav|B|peaceful;Arjun|B|bright, the archer;Aditya|B|the Sun;Advait|B|unique;Ananya|G|unique;Aadhya|G|the first power;Anika|G|grace;Avni|G|earth;Aryan|B|noble;Amit|B|infinite;Anjali|G|offering;Akash|B|sky
Ishaan|B|lord of the north-east;Ira|G|earth;Isha|G|goddess;Ishita|G|mastery;Indra|B|king of gods;Indu|G|the Moon
Uday|B|rising;Utkarsh|B|excellence;Urvi|G|earth;Usha|G|dawn;Uma|G|Parvati;Ujjwal|B|bright
Eshan|B|desirable;Ekansh|B|whole;Esha|G|desire;Ekta|G|unity
Om|B|the sacred sound;Ojas|B|vitality;Omkar|B|the sound Om;Ojasvi|G|brilliant
Varun|B|lord of water;Vansh|B|lineage;Vaani|G|speech;Varsha|G|rain;Vayu|B|wind
Vihaan|B|dawn;Vivaan|B|full of life;Vivek|B|wisdom;Vidya|G|knowledge;Vinita|G|humble;Vikram|B|valour
Vrinda|G|basil;Vrishank|B|Shiva
Ved|B|sacred knowledge;Vedant|B|end of the Vedas;Vedika|G|altar;Vedanshi|G|part of the Vedas
Vyom|B|sky;Vyas|B|the sage
Kabir|B|great;Kavya|G|poetry;Karan|B|a warrior;Kavish|B|poet;Kajal|G|kohl;Kartik|B|a Hindu month;Kanika|G|small particle
Kiaan|B|grace of God;Kiara|G|bright;Kirti|G|fame;Kiran|B|ray of light;Kinjal|G|river bank
Kunal|B|lotus;Kush|B|son of Rama;Kumud|G|lotus;Kusum|G|flower
Ghanshyam|B|Krishna;Gharana|G|family
Ketan|B|home;Ketki|G|a flower;Keshav|B|Krishna;Keya|G|a flower
Koyal|G|cuckoo;Komal|G|tender;Kovid|B|learned;Kopal|G|new leaf
Harsh|B|joy;Harini|G|deer;Hari|B|Vishnu;Hansa|G|swan;Harshita|G|joyful
Himanshu|B|the Moon;Hiral|G|diamond;Hina|G|henna;Hitesh|B|lord of welfare
Hussain|B|handsome;Humsa|G|swan
Hemant|B|early winter;Hema|G|golden;Hemal|G|golden
Hoshank|B|wise;Hoor|G|celestial
Daksh|B|capable;Darsh|B|sight;Damini|G|lightning;Dakshita|G|skilled;Dayal|B|kind
Divya|G|divine;Dishant|B|horizon;Divit|B|immortal;Diya|G|lamp;Disha|G|direction
Dushyant|B|a king;Durga|G|the goddess;Durva|G|sacred grass
Dev|B|god;Devansh|B|part of god;Devika|G|little goddess;Deepak|B|lamp;Deepa|G|lamp
Dorothy|G|gift of god;Dorik|B|ruler
Madhav|B|Krishna;Manav|B|human;Mahi|G|earth;Maya|G|illusion;Mahesh|B|Shiva;Manya|G|respected
Mihir|B|the Sun;Mitali|G|friendship;Mira|G|devotee of Krishna;Milan|B|union
Mukul|B|bud;Mukta|G|pearl;Mudit|B|happy;Muskan|G|smile
Meet|B|friend;Megha|G|cloud;Meera|G|devotee of Krishna;Mehul|B|rain
Mohan|B|Krishna;Mohit|B|charmed;Mohini|G|enchanting;Moksh|B|liberation
Tanay|B|son;Tanvi|G|delicate;Tara|G|star;Tarun|B|young;Tanish|B|ambition
Tilak|B|mark of honour;Tisha|G|joy;Titiksha|G|patience
Tushar|B|snow;Tulsi|G|holy basil;Tuhina|G|dew
Tejas|B|brilliance;Teja|G|radiance;Tejasvi|B|bright
Toral|G|a folk heroine;Tosh|B|contentment;Toshani|G|satisfaction
Parth|B|Arjuna;Pari|G|fairy;Pallavi|G|new leaves;Pranav|B|the sound Om;Pavan|B|wind;Pakhi|G|bird
Pihu|G|peacock's call;Pinaki|B|Shiva;Pihul|G|gentle
Pushkar|B|lotus;Puja|G|worship;Punit|B|pure;Purvi|G|from the east
Shaurya|B|bravery;Shanaya|G|eminent;Shiv|B|auspicious;Shreya|G|excellence;Sharvani|G|Parvati;Shashank|B|the Moon
Naman|B|salutation;Naina|G|eyes;Navya|G|new;Nakul|B|a Pandava;Nandini|G|daughter
Thakur|B|lord;Thanvi|G|delicate
Pearl|G|precious gem;Pehal|B|beginning
Pooja|G|worship;Poorvi|G|a raga;Poonam|G|full moon;Pooran|B|complete
Rahul|B|efficient;Riya|G|singer;Rohan|B|ascending;Radha|G|beloved of Krishna;Raghav|B|Rama;Ranveer|B|brave warrior
Rishi|B|sage;Ritika|G|movement;Rishabh|B|superior;Riddhi|G|prosperity;Ritvik|B|priest
Rudra|B|Shiva;Ruhi|G|soul;Rupal|G|made of silver;Rushil|B|charming
Reyansh|B|ray of light;Reva|G|a river;Reet|G|tradition;Reshma|G|silky
Rohit|B|red;Rohini|G|a nakshatra;Roshan|B|bright;Roshni|G|light
Taarak|B|protector;Taarini|G|saviour
Nikhil|B|complete;Nidhi|G|treasure;Nisha|G|night;Nishant|B|dawn;Niharika|G|nebula
Nupur|G|anklet;Nutan|B|new
Neel|B|blue;Neha|G|love;Neelam|G|sapphire;Neeraj|B|lotus
Noor|G|light;Nobin|B|new
Yash|B|fame;Yamini|G|night;Yati|B|ascetic;Yashvi|G|glorious
Yuvraj|B|crown prince;Yukti|G|skill;Yug|B|era;Yutika|G|a flower
Yesha|G|glory;Yeshwant|B|famous
Yogesh|B|lord of yoga;Yogita|G|disciplined;Yojit|B|planner
Bharat|B|India, a king;Bhavya|G|grand;Bhavana|G|feeling;Bhavesh|B|lord of the world
Bhishma|B|the Pandava elder;Bhoomi|G|earth
Bhushan|B|ornament;Bhumika|G|earth
Dhruv|B|pole star;Dhara|G|earth;Dhairya|B|patience;Dhanvi|G|wealthy;Dharmesh|B|lord of dharma
Phalguni|G|a nakshatra;Phani|B|serpent
Bhel|B|a friend;Bhoj|B|a king
Jay|B|victory;Jaya|G|victory;Janvi|G|river Ganga;Jatin|B|ascetic;Jahnavi|G|river Ganga
Jiya|G|heart;Jivan|B|life;Jigar|B|heart;Jinal|G|devotee
Khilan|B|blossom;Khushi|G|happiness;Khushal|B|happy;Khevna|G|wish
Juhi|G|jasmine;Jugal|B|pair
Jeet|B|victory;Jeevika|G|livelihood
Jyoti|G|light;Jyotish|B|astrologer
Garv|B|pride;Gauri|G|Parvati;Gaurav|B|honour;Gargi|G|a scholar;Gayatri|G|a hymn
Girish|B|lord of mountains;Girija|G|Parvati;Gita|G|sacred song
Gunjan|G|humming;Gunit|B|talented;Gulshan|B|garden
Geet|G|song;Geetika|G|little song
Govind|B|Krishna;Gopal|B|Krishna;Gopika|G|cowherd girl
Sai|B|a saint;Saanvi|G|Lakshmi;Sahil|B|shore;Sara|G|pure;Sarthak|B|meaningful
Siddharth|B|who has attained;Siya|G|Sita;Simran|G|remembrance;Siddhi|G|achievement
Suresh|B|lord of gods;Sujal|B|affectionate;Suhani|G|pleasant;Sumit|B|a good friend
Sejal|G|pure water;Sehaj|B|calm;Seema|G|boundary
Soham|B|I am that;Sonal|G|golden;Somya|G|gentle;Sohan|B|handsome
Chahat|G|wish;Chaitanya|B|consciousness;Chandan|B|sandalwood;Chandni|G|moonlight;Charu|G|beautiful
Chirag|B|lamp;Chitra|G|picture;Chinmay|B|full of knowledge;Chitvan|B|with a beautiful look
`;

export const BABY_NAMES: BabyName[] = RAW.trim()
  .split(/[;\n]/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [name, g, meaning] = s.split("|");
    return { name, gender: g === "B" ? ("Boy" as const) : ("Girl" as const), meaning };
  });

/** Syllables for a nakshatra (optionally one pada), split where two spellings are given. */
export function syllablesFor(nakshatraIndex: number, pada?: number): string[] {
  const list = pada ? [NAMAKSHAR[nakshatraIndex][pada - 1]] : NAMAKSHAR[nakshatraIndex];
  return list.flatMap((s) => s.split("/").map((x) => x.trim()));
}

/** Names starting with any of the syllables; a longer syllable wins over a shorter one it contains (e.g. "Chha" over "Cha"). */
export function namesFor(syllables: string[], gender?: "Boy" | "Girl"): { syllable: string; names: BabyName[] }[] {
  const all = NAKSHATRAS.flatMap((_, i) => syllablesFor(i)).map((s) => s.toLowerCase());
  return syllables.map((syl) => {
    const s = syl.toLowerCase();
    const longer = all.filter((x) => x.length > s.length && x.startsWith(s));
    return {
      syllable: syl,
      names: BABY_NAMES.filter((n) => {
        const low = n.name.toLowerCase();
        return low.startsWith(s) && !longer.some((l) => low.startsWith(l)) && (!gender || n.gender === gender);
      }),
    };
  });
}
