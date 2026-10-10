import {describe,it,expect,vi} from "vitest";
import {NextRequest} from "next/server";
vi.mock("@/lib/astrology/birthSensitivity",()=>({birthSensitivity:vi.fn(()=>({window:5,sampleCount:11,fields:[]}))}));
vi.mock("@/lib/rateLimit",()=>({checkRateLimit:vi.fn(()=>({allowed:true,retryAfterSec:0}))}));
import {POST} from "./route";
import {birthSensitivity} from "@/lib/astrology/birthSensitivity";
import {checkRateLimit} from "@/lib/rateLimit";
const birth={name:"Test",date:"1990-04-12",time:"06:45:32",latitude:26.9124,longitude:75.7873,timezone:"Asia/Kolkata",place:"Jaipur"};
const request=(body:unknown)=>new NextRequest("http://localhost/api/kundali/sensitivity",{method:"POST",body:JSON.stringify(body)});
describe("sensitivity API bounds",()=>{
 it("preserves recorded seconds and allowed uncertainty intervals",async()=>{const response=await POST(request({birth,window:5}));expect(response.status).toBe(200);expect(birthSensitivity).toHaveBeenCalledWith(birth,5);});
 it.each([120,-5,.5,"5"])("rejects unsupported interval %s",async window=>{expect((await POST(request({birth,window}))).status).toBe(400);});
 it("rejects an invalid clock input",async()=>{expect((await POST(request({birth:{...birth,time:"25:99"},window:5}))).status).toBe(400);});
 it("rate limits chart expansion",async()=>{vi.mocked(checkRateLimit).mockReturnValueOnce({allowed:false,retryAfterSec:60});expect((await POST(request({birth,window:5}))).status).toBe(429);});
});
