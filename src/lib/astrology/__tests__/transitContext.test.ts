import {describe,it,expect} from "vitest";
import {MAITRI_PLANETS,panchadhaMaitri} from "../maitri";
import {moortiFromHouse,transitNakshatra,currentSignIngress,transitContext} from "../transitContext";
import {calculateKundali} from "../kundali";
import {currentTransits} from "../transits";
import {siderealLongitude} from "../ephemeris";

const birth={name:"Test",date:"1990-04-12",time:"06:45",latitude:26.9124,longitude:75.7873,timezone:"Asia/Kolkata",place:"Jaipur"};
describe("Panchadha Maitri",()=>{
 it("combines all six natural/temporary cases directionally",()=>{
 const relation=(a:"Sun"|"Mercury",b:"Moon"|"Venus"|"Sun",distance:number)=>panchadhaMaitri([{planet:a,signIndex:0},{planet:b,signIndex:distance-1}]).find(r=>r.from===a&&r.to===b)!;
 expect(relation("Sun","Moon",2).compound).toBe("Great friend");expect(relation("Sun","Moon",1).compound).toBe("Neutral");
 expect(relation("Sun","Venus",2).compound).toBe("Neutral");expect(relation("Sun","Venus",1).compound).toBe("Great enemy");
 const neutral=panchadhaMaitri([{planet:"Sun",signIndex:0},{planet:"Mercury",signIndex:1}]);expect(neutral.find(r=>r.from==="Sun")!.compound).toBe("Friend");expect(neutral.find(r=>r.from==="Mercury")!.compound).toBe("Great friend");
 expect(panchadhaMaitri([{planet:"Sun",signIndex:0},{planet:"Mercury",signIndex:0}]).find(r=>r.from==="Sun")!.compound).toBe("Enemy");
 });
 it("covers exactly 42 directed classical pairs and excludes self/nodes",()=>{
 const rows=panchadhaMaitri([...MAITRI_PLANETS.map((planet,i)=>({planet,signIndex:i})),{planet:"Rahu",signIndex:0}]);expect(rows).toHaveLength(42);expect(rows.every(r=>r.from!==r.to&&r.from!=="Rahu"&&r.to!=="Rahu")).toBe(true);
 });
 it.each(Array.from({length:12},(_,i)=>i+1))("uses the temporary friendship houses for distance %i",distance=>{
 const r=panchadhaMaitri([{planet:"Sun",signIndex:11},{planet:"Moon",signIndex:(11+distance-1)%12}])[0];expect(r.distance).toBe(distance);expect(r.temporary).toBe([2,3,4,10,11,12].includes(distance)?"Friend":"Enemy");
 });
});
describe("Moorti and tara conventions",()=>{
 it.each([["Swarna",[1,6,11]],["Rajata",[2,5,9]],["Tamra",[3,7,10]],["Loha",[4,8,12]]] as const)("assigns %s from Moon-at-ingress distance",(name,houses)=>{for(const h of houses)expect(moortiFromHouse(h).name).toBe(name);});
 it("rejects invalid Moon distances",()=>{expect(()=>moortiFromHouse(0)).toThrow();expect(()=>moortiFromHouse(13)).toThrow();});
 it("counts inclusively and wraps tara from the natal Moon star",()=>{
 expect(transitNakshatra(0,26)).toMatchObject({index:0,count:2,tara:"Sampat",pada:1});expect(transitNakshatra(359.999,26)).toMatchObject({index:26,count:1,tara:"Janma",pada:4});
 for(let i=0;i<27;i++){const n=transitNakshatra((i+.1)*360/27,0);expect(n.count).toBe(i+1);expect(n.tone).toBe(i%9===0?"Mixed":[2,4,6].includes(i%9)?"Demanding":"Supportive");}
 });
 it("refines an ingress boundary rather than using the selected day's Moon",()=>{const at=new Date("2026-10-10T12:00:00Z");const ingress=currentSignIngress("Moon",at)!;const sign=Math.floor(siderealLongitude("Moon",at)/30);expect(ingress.getTime()).toBeLessThan(at.getTime());expect(Math.floor(siderealLongitude("Moon",ingress)/30)).toBe(sign);expect(Math.floor(siderealLongitude("Moon",new Date(+ingress-2000))/30)).not.toBe(sign);});
 it("indexes BAV and SAV by transit zodiac sign, leaving nodes without BAV",()=>{
 const chart=calculateKundali(birth);const at=new Date("2026-10-10T12:00:00Z");const transits=currentTransits(chart.planets.find(p=>p.planet==="Moon")!.signIndex,chart.ascendant.signIndex,at);const rows=transitContext(chart,transits,at);
 rows.forEach((row,i)=>{const t=transits[i];expect(row.sav).toBe(chart.ashtakavarga.sarva[t.signIndex]);expect(row.bav).toBe(t.planet==="Rahu"||t.planet==="Ketu"?null:chart.ashtakavarga.bhinna[t.planet][t.signIndex]);if(row.moorti)expect(row.moorti.moonHouse).toBe(((Math.floor(siderealLongitude("Moon",row.moorti.ingress)/30)-chart.planets.find(p=>p.planet==="Moon")!.signIndex+12)%12)+1);});
 });
});
