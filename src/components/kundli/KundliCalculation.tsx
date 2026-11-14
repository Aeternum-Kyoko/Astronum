"use client";
import { useEffect, useState } from "react";
import type { BirthParams } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import KundliChart from "../KundliChart";
import "./calculation.css";

export default function KundliCalculation({birth,chart,onSkip}:{birth:BirthParams;chart?:KundaliChart|null;onSkip?:()=>void}) {
 const hi=useLocale()==="hi",[elapsed,setElapsed]=useState(0),[skipped,setSkipped]=useState(false);
 useEffect(()=>{const start=performance.now();const timer=setInterval(()=>setElapsed((performance.now()-start)/1000),200);return()=>clearInterval(timer);},[]);
 const [revealDelay,setRevealDelay]=useState<number|null>(chart?3.6:null);
 if(chart&&revealDelay===null)setRevealDelay(Math.max(0,3.6-elapsed));
 const steps=hi?["जन्म क्षण की पुष्टि","भावों का रेखांकन","ग्रहों को स्थान देना","आपका कुंडली कक्ष तैयार"]:["Anchoring your birth moment","Drawing the twelve houses","Placing your calculated planets","Preparing your personal guide"];
 const stage=Math.min(3,Math.floor(elapsed/1.5));
 return <section className="kundli-handcraft" aria-busy="true" aria-labelledby="handcraft-title"><header><span>{hi?"जन्म के क्षण से, आपके लिए":"From a moment in time. Made yours."}</span><h2 id="handcraft-title">{hi?`${birth.name}, आपकी कहानी आकार ले रही है।`:`Your story is taking shape, ${birth.name}.`}</h2><p>{birth.date} · {birth.time} · {birth.place}</p></header><div className="handcraft-stage" aria-hidden="true"><svg className="handcraft-drawing" viewBox="0 0 400 400" fill="none"><path className="handcraft-frame" pathLength="1" d="M45 45H355V355H45Z"/><path className="handcraft-diamond" pathLength="1" d="M200 45 355 200 200 355 45 200Z"/><path className="handcraft-cross" pathLength="1" d="m45 45 310 310M355 45 45 355"/><circle className="handcraft-pen" r="3" fill="currentColor"><animateMotion dur="3.3s" fill="freeze" path="M45 45H355V355H45V45L355 355M355 45 45 355"/></circle></svg>{chart&&<div className="handcraft-computed" style={{animationDelay:`${revealDelay??0}s`}}><KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} style="north" showLegend={false} ariaLabel={hi?"गणना की गई कुंडली":"Calculated birth chart"}/></div>}</div><div className="handcraft-stages">{steps.map((step,i)=><span key={step} data-active={stage===i} data-complete={stage>i}>{stage>i?"✓":String(i+1).padStart(2,"0")}<strong>{step}</strong></span>)}</div><p className="handcraft-status" role="status">{!chart&&elapsed>6?(hi?"गणना जारी है। कुंडली तैयार होते ही खुलेगी।":"The astronomical calculation is still running. Your chart opens when it is ready."):chart?(hi?"गणना पूरी है। आपकी कुंडली का परिचय तैयार हो रहा है।":"Calculation complete. Revealing your personal chart."):(hi?"आपके जन्म क्षण के ग्रहों की गणना जारी है।":"Calculating planetary positions for your birth moment.")}</p><button type="button" disabled={skipped} onClick={()=>{setSkipped(true);onSkip?.();}}>{skipped?(hi?"गणना पूरी होने की प्रतीक्षा…":"Waiting for calculation…"):(hi?"एनीमेशन छोड़ें":"Skip cinematic reveal")} ↗</button><small>{birth.latitude.toFixed(5)}°, {birth.longitude.toFixed(5)}° · {birth.timezone}</small></section>;
}
