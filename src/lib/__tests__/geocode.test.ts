import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodePlace } from "../geocode";

afterEach(()=>vi.unstubAllGlobals());
describe("autocomplete geocoding",()=>{
 it("reads GeoJSON longitude/latitude correctly and resolves a historical timezone",async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({features:[
   {geometry:{coordinates:[151.2093,-33.8688]},properties:{name:"Sydney",city:"Sydney",state:"New South Wales",country:"Australia"}},
   {geometry:{coordinates:[151.2093,-33.8688]},properties:{name:"Duplicate"}},
   {geometry:{coordinates:[999,999]},properties:{name:"Invalid"}},
  ]})});
  vi.stubGlobal("fetch",fetchMock);
  const results=await geocodePlace("Syd");
  expect(results).toEqual([{displayName:"Sydney, New South Wales, Australia",latitude:-33.8688,longitude:151.2093,timezone:"Australia/Sydney"}]);
  expect(String(fetchMock.mock.calls[0][0])).toContain("photon.komoot.io/api/");
 });
 it("surfaces provider failures instead of presenting unconfirmed locations",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,status:429}));
  await expect(geocodePlace("Jaipur")).rejects.toThrow("429");
 });
});
