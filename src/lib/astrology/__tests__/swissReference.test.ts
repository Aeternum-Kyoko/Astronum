import {describe,it,expect} from "vitest";
import {computeRawPositions} from "../ephemeris";
/** Independently obtained from Astrodienst's Swiss Ephemeris 2.10.03 web test.
 * https://www.astro.com/cgi/swetest.cgi?arg=-b12.4.1990%20-ut1:15%20-p0123456%20-fPl%20-n1
 * Retrieved 2026-10-10. Header verified 12 Apr 1990, 01:15 UT,
 * JD 2447993.552083333. Apparent geocentric tropical longitudes in degrees.
 * This is one benchmark instant, not certification over the engine's full range.
 * 0.02° allows differing apparent-position models without masking sign errors.
 */
const reference={Sun:21.8788102,Moon:222.9085976,Mercury:41.2060690,Venus:335.8941328,Mars:323.3656888,Jupiter:94.0781639,Saturn:294.9107502};
describe("independent Swiss Ephemeris planetary benchmark",()=>{
 const calculated=computeRawPositions(new Date("1990-04-12T01:15:00Z")).tropicalLongitudes;
 it.each(Object.entries(reference))("matches %s within 0.02 degrees",(planet,expected)=>{const actual=calculated[planet as keyof typeof reference];const delta=Math.abs(((actual-expected+540)%360)-180);expect(delta).toBeLessThan(.02);});
});
