"use client";
import type { KundaliChart } from "@/lib/astrology/types";
import type { VargaKey } from "@/lib/astrology/constants";
import { SIGN_LORDS, SIGNS } from "@/lib/astrology/constants";
import { inspectChart, type InspectionPick } from "@/lib/astrology/chartInspection";
import { getAspectedHouses } from "@/lib/astrology/aspects";
import { readConjunctions, houseMeaning } from "@/lib/astrology/vargaReading";
import { houseSignification, planetKeynote, signKeynote } from "@/lib/astrology/content";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";

export default function ChartSelectionReading({chart,lens,pick,mode,onClose,id}:{chart:KundaliChart;lens:VargaKey|"transit";pick:InspectionPick;mode:"user"|"astrologer";onClose:()=>void;id:string}) {
  const a=useAnalysis()!;const locale=useLocale();const hi=locale==="hi";const n=(s:string)=>term(locale,s);
  const detail=lens==="transit"?null:inspectChart(chart,lens,pick,a.at);
  const moving=lens==="transit"&&pick.kind==="planet"?a.transits.find(p=>p.planet===pick.planet):null;
  const house=detail?.house??(pick.kind==="house"?pick.house:moving?.houseFromLagna??1);
  const sign=detail?.sign??SIGNS[(chart.ascendant.signIndex+house-1)%12];
  const sameHouse=a.transits.filter(p=>p.houseFromLagna===house);
  const conjunct=detail?detail.conjunctPlanets.map(p=>p.planet):sameHouse.filter(p=>pick.kind!=="planet"||p.planet!==pick.planet).map(p=>p.planet);
  const incoming=detail?detail.incoming.map(p=>p.planet):a.transits.filter(p=>p.houseFromLagna!==house&&getAspectedHouses(p.planet).includes((house-p.houseFromLagna+12)%12+1)).map(p=>p.planet);
  const outgoing=detail?.outgoing??(moving?getAspectedHouses(moving.planet).map(offset=>(house+offset-2)%12+1):[]);
  const lord=detail?.lord??SIGN_LORDS[(chart.ascendant.signIndex+house-1)%12];
  const meaning=(target:number)=>!hi&&lens!=="D1"&&lens!=="transit"&&lens!=="D2"?houseMeaning(lens,target):houseSignification(target,locale);
  const empty=hi?"इन नियमों में कोई नहीं":"None under these rules";
  const combinations=detail?.conjunctionReadings??readConjunctions({varga:"D1",ascendantSignIndex:chart.ascendant.signIndex,planets:a.transits.map(p=>({planet:p.planet,signIndex:p.signIndex}))}).filter(group=>group.house===house);
  return <section className="obs-selection-reading" id={id} aria-live="polite"><header><div><span>{lens==="transit"?`${hi?"गोचर":"Transit"} · ${a.date} ${a.time.slice(0,5)}`:`${lens} · ${hi?"जन्म कुंडली":"Natal chart"}`}</span><h3>{pick.kind==="planet"?n(pick.planet):`${hi?"भाव":"House"} ${house}`} · {n(sign)}</h3></div><button type="button" onClick={onClose} aria-label={hi?"विश्लेषण बंद करें":"Close chart analysis"}>{hi?"बंद करें":"Close"} ×</button></header>
    <div className="obs-reading-factors"><article><h4>{hi?"राशि और स्थिति":"Sign & condition"}</h4><strong>{n(sign)}{detail?.planet?.dignity?` · ${n(detail.planet.dignity)}`:""}</strong><p>{signKeynote(sign,locale)}</p>{(lens==="D1"&&detail?.natal||moving)&&<small>{(detail?.natal?.degreeInSign??moving?.degree)?.toFixed(2)}° {hi?"राशि में":"within the sign"}</small>}</article><article><h4>{hi?"भाव और स्वामी":"House & ruler"}</h4><strong>{hi?"भाव":"House"} {house} · {n(lord)}</strong><p>{lens==="D2"?(hi?"दो राशि वाली होरा को सामान्य बारह भावों की तरह न पढ़ें।":"The two-sign Hora is not interpreted as an ordinary twelve-house chart."):meaning(house)}</p>{detail&&<small>{hi?"भावेश की स्थिति":"Ruler placed in house"} {detail.lordPlacement.house} · {n(detail.lordPlacement.sign)}</small>}</article><article><h4>{pick.kind==="planet"?(hi?"एक राशि में युति":"Same-sign conjunctions"):(hi?"इस भाव के ग्रह":"Planets in this house")}</h4><strong>{conjunct.map(n).join(", ")||empty}</strong><p>{conjunct.length?(hi?"एक राशि में ग्रह उसी भाव के विषय साझा करते हैं। जन्म अंश होने पर दूरी भी देखें।":"These planets share the sign and its house themes. Where natal degrees are available, compare their separation too."):(hi?"इस चयन में कोई अन्य ग्रह साथ नहीं है।":"No other planets share this selected placement.")}</p>{lens==="D1"&&detail?.natal&&conjunct.length>0&&<small>{conjunct.map(name=>{const other=chart.planets.find(p=>p.planet===name)!;return `${n(name)}: ${Math.abs(other.degreeInSign-detail.natal!.degreeInSign).toFixed(2)}°`;}).join(" · ")}</small>}</article><article><h4>{hi?"मिलने वाली दृष्टियाँ":"Aspects received"}</h4><strong>{incoming.map(n).join(", ")||empty}</strong><p>{hi?"ग्रह दृष्टि और युति अलग संकेत हैं; दोनों को राशि, भाव और बल के साथ पढ़ें।":"Aspecting planets add their themes to this house. Read these contacts alongside sign, conjunctions and strength."}</p></article></div>
    <details className="obs-selection-synthesis" open={mode==="astrologer"}><summary>{hi?"संयुक्त व्याख्या खोलें":"Read the combined interpretation"}</summary><p>{detail?(pick.kind==="planet"?detail.planetReading?.reading:detail.houseReading?.reading)??(lens==="D2"?(hi?"होरा की राशि और ग्रह-समूह को धन के संदर्भ में D1 के साथ पढ़ें।":"Read the Hora sign and planetary grouping in the context of resources, alongside D1."):houseSignification(house,locale)):`${pick.kind==="planet"?`${n(pick.planet)} · ${planetKeynote(pick.planet,locale)}. `:""}${n(sign)} · ${houseSignification(house,locale)}`}</p>{combinations.map(group=><p key={group.house}>{group.reading}</p>)}{incoming.length>0&&<p>{hi?"दृष्टि देने वाले ग्रहों के पारंपरिक विषय":"Traditional themes brought by the aspecting planets"}: {incoming.map(name=>`${n(name)} (${planetKeynote(name,locale)})`).join("; ")}. {hi?"इन्हें इस राशि, भाव और युति के साथ पढ़ें।":"Read these alongside this sign, house and conjunction group."}</p>}{mode==="astrologer"&&detail?.planetReading&&<p>{detail.planetReading.basis}</p>}</details>
    {!!outgoing.length&&lens!=="D2"&&<details className="obs-aspect-destinations"><summary>{hi?"दृष्टि कहाँ जाती है":"Where the selected planet casts aspects"} · {outgoing.join(", ")}</summary>{outgoing.map(target=><article key={target}><strong>{hi?"भाव":"House"} {target}</strong><p>{meaning(target)}</p><small>{hi?"स्थित ग्रह":"Occupants"}: {(detail?detail.planets.filter(p=>p.house===target).map(p=>p.planet):a.transits.filter(p=>p.houseFromLagna===target).map(p=>p.planet)).map(n).join(", ")||"—"}</small></article>)}</details>}
  </section>;
}
