import {describe,it,expect,vi} from "vitest";
const model=vi.hoisted(()=>({longitude:(_planet:string,_at:Date):number=>0}));
vi.mock("../ephemeris",()=>({siderealLongitude:(planet:string,at:Date)=>model.longitude(planet,at)}));
import {currentSignIngress} from "../transitContext";
const DAY=86400000;
describe("latest ingress search",()=>{
 it("finds the latest retrograde re-entry rather than the earlier direct ingress",()=>{
 const at=new Date("2031-01-10T12:00:00Z");const end=at.getTime();
 // Enter sign 1, leave sign 1, then retrograde back into sign 1 two days ago.
 model.longitude=(_p,date)=>{const days=(end-date.getTime())/DAY;return days<=2?59:days<=8?61:days<=12?59:29;};
 const ingress=currentSignIngress("Mercury",at)!;expect(+ingress).toBeGreaterThanOrEqual(end-2*DAY);expect(+ingress-(end-2*DAY)).toBeLessThanOrEqual(1000);
 });
 it("returns an explicit unresolved result when no boundary is found",()=>{
 model.longitude=()=>50;expect(currentSignIngress("Moon",new Date("2032-01-10T12:00:00Z"))).toBeNull();
 });
 it("handles the Aries/Pisces wrap without requiring forward motion",()=>{
 const at=new Date("2033-01-10T12:00:00Z");model.longitude=(_p,d)=>+d>=+at-DAY?359.9:.1;const ingress=currentSignIngress("Moon",at)!;expect(+ingress-(+at-DAY)).toBeLessThanOrEqual(1000);expect(+ingress).toBeGreaterThanOrEqual(+at-DAY);
 });
});
