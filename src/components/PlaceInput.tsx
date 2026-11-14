"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

const BirthMapPicker=dynamic(()=>import("./BirthMapPicker"),{ssr:false,loading:()=> <p>Opening map…</p>});

export interface PlaceSuggestion { displayName:string; latitude:number; longitude:number; timezone:string }
/** Debounced worldwide suggestions with editable coordinates and timezone confirmation. */
export default function PlaceInput({selected,onSelect,showTimezone=true,placeholder}:{selected:PlaceSuggestion|null;onSelect:(place:PlaceSuggestion|null)=>void;showTimezone?:boolean;placeholder?:string}) {
 const hi=useLocale()==="hi";
 const id=useId();
 const [query,setQuery]=useState(selected?.displayName??"");
 const [results,setResults]=useState<PlaceSuggestion[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [active,setActive]=useState(-1);
 const [dismissed,setDismissed]=useState(false);
 const [manual,setManual]=useState(false);
 const [mapOpen,setMapOpen]=useState(false);
 const [latitude,setLatitude]=useState(String(selected?.latitude??""));
 const [longitude,setLongitude]=useState(String(selected?.longitude??""));
 const [zone,setZone]=useState(selected?.timezone??"");
 const [label,setLabel]=useState(selected?.displayName??"");
 const request=useRef<AbortController|null>(null);
 const [last,setLast]=useState(selected);
 useEffect(()=>()=>request.current?.abort(),[]);
 if(selected!==last){setLast(selected);if(selected){setQuery(selected.displayName);setLatitude(String(selected.latitude));setLongitude(String(selected.longitude));setZone(selected.timezone);setLabel(selected.displayName);}}
 const search=useCallback(async function search(){
   if(query.trim().length<2){setError(hi?"शहर या स्थान का नाम दर्ज करें।":"Enter a city or place name.");return;}
   request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError("");setResults([]);
   try{const res=await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`,{signal:controller.signal});const data=await res.json();if(!res.ok)throw new Error(data.error??"Place search unavailable");setResults(data.results??[]);if(!data.results?.length)setError(hi?"स्थान नहीं मिला। निर्देशांक दर्ज करें।":"No places found. Try city and country, or enter coordinates.");}
   catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Place search unavailable. Use manual coordinates.");}finally{if(!controller.signal.aborted)setBusy(false);}
 },[query,hi]);
 useEffect(()=>{
   if(query.trim().length<3||selected?.displayName===query||dismissed)return;
   const timer=setTimeout(()=>void search(),550);
   return()=>{clearTimeout(timer);request.current?.abort();};
 },[query,selected?.displayName,dismissed,search]);
 async function detectZone(){if(latitude.trim()===""||longitude.trim()===""){setError("Enter latitude and longitude first.");return;}setBusy(true);setError("");try{const res=await fetch(`/api/geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);const data=await res.json();if(!res.ok||!data.timezone)throw new Error(data.error??"Enter the timezone manually.");setZone(data.timezone);}catch(e){setError(e instanceof Error?e.message:"Timezone lookup failed");}finally{setBusy(false);}}
 function apply(){const lat=Number(latitude),lon=Number(longitude);if(!label.trim()||latitude.trim()===""||longitude.trim()===""||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!zone.trim()){setError(hi?"नाम, सही निर्देशांक और समय क्षेत्र दर्ज करें।":"Enter a place name, valid latitude (−90 to 90), longitude (−180 to 180), and timezone.");return;}onSelect({displayName:label.trim(),latitude:lat,longitude:lon,timezone:zone.trim()});setResults([]);setError("");setManual(false);}
 return <div className="birth-place-search">
  <div className="birth-place-query"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={results.length>0} aria-controls={`${id}-results`} aria-activedescendant={active>=0?`${id}-option-${active}`:undefined} aria-label={hi?"जन्म स्थान खोजें":"Search birthplace worldwide"} value={query} onChange={e=>{request.current?.abort();setBusy(false);setError("");setQuery(e.target.value);onSelect(null);setResults([]);setActive(-1);setDismissed(false);}} onKeyDown={e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setActive(i=>results.length?(i+(e.key==="ArrowDown"?1:-1)+results.length)%results.length:-1);}if(e.key==="Enter"){e.preventDefault();if(active>=0&&results[active]){onSelect(results[active]);setResults([]);setActive(-1);}else void search();}if(e.key==="Escape"){request.current?.abort();setBusy(false);setResults([]);setActive(-1);setDismissed(true);}}} placeholder={placeholder??(hi?"शहर और देश, जैसे जयपुर, भारत":"Start typing a city or birthplace…")} className="input" autoComplete="off"/><span className={`birth-search-indicator ${busy?"is-searching":""}`} aria-hidden="true">{busy?"◌":"⌕"}</span></div>
  <p className="birth-search-hint" role="status">{busy?(hi?"खोज जारी…":"Finding places…"):selected?(hi?"स्थान की पुष्टि हो गई":"Birthplace confirmed"):(hi?"टाइप करें, फिर सही स्थान चुनें":"Type at least 3 letters, then choose your birthplace.")}</p>
  {results.length>0&&<ul id={`${id}-results`} role="listbox" className="birth-place-results" aria-label={hi?"मिले स्थान":"Place search results"}>{results.map((p,i)=><li key={`${p.latitude}:${p.longitude}:${i}`} role="presentation"><button id={`${id}-option-${i}`} role="option" aria-selected={active===i} type="button" onClick={()=>{onSelect(p);setResults([]);setActive(-1);setError("");}}><strong>{p.displayName}</strong><small>{p.latitude.toFixed(5)}°, {p.longitude.toFixed(5)}° · {p.timezone||"Confirm timezone manually"}</small></button></li>)}</ul>}
  {selected&&showTimezone&&<div className="birth-place-confirmed"><strong>{selected.displayName}</strong><span>{selected.latitude.toFixed(5)}°, {selected.longitude.toFixed(5)}° · {selected.timezone||"Timezone required"}</span><a href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=14/${selected.latitude}/${selected.longitude}`} target="_blank" rel="noreferrer">{hi?"मानचित्र पर सत्यापित करें":"Verify on map"} ↗</a></div>}
  <button className="birth-manual-toggle" type="button" aria-expanded={manual} onClick={()=>{setManual(!manual);setError("");}}>{hi?"निर्देशांक और समय क्षेत्र स्वयं दर्ज करें":"Enter or correct coordinates & timezone"} {manual?"−":"+"}</button>
  {manual&&<div className="birth-place-manual"><button type="button" className="birth-map-open" aria-expanded={mapOpen} onClick={()=>setMapOpen(!mapOpen)}>{mapOpen?"Close map":"Pick birthplace on a map"} {mapOpen?"−":"+"}</button>{mapOpen&&<BirthMapPicker latitude={latitude.trim()?Number(latitude):20} longitude={longitude.trim()?Number(longitude):0} onPick={(lat,lon)=>{setLatitude(String(lat));setLongitude(String(lon));setZone("");setLabel(`Map pin at ${lat.toFixed(5)}, ${lon.toFixed(5)}`);onSelect(null);}}/>}<label>{hi?"स्थान का नाम":"Place label"}<input value={label} onChange={e=>setLabel(e.target.value)} className="input" placeholder="Town, region, country"/></label><div className="birth-coordinate-pair"><label>{hi?"अक्षांश":"Latitude"}<input type="number" min="-90" max="90" step="any" value={latitude} onChange={e=>setLatitude(e.target.value)} className="input"/></label><label>{hi?"देशांतर":"Longitude"}<input type="number" min="-180" max="180" step="any" value={longitude} onChange={e=>setLongitude(e.target.value)} className="input"/></label></div><label>{hi?"समय क्षेत्र / दर्ज UTC अंतर":"Timezone / recorded UTC offset"}<input className="input" value={zone} onChange={e=>setZone(e.target.value)} placeholder="Asia/Kolkata or UTC+05:30"/></label><div className="birth-place-actions"><button type="button" disabled={busy} onClick={()=>void detectZone()}>{hi?"समय क्षेत्र खोजें":"Detect timezone"}</button><button type="button" onClick={apply}>{hi?"यह स्थान उपयोग करें":"Use this location"}</button></div><p>{hi?"ऋणात्मक अक्षांश दक्षिण और देशांतर पश्चिम है। सीमा के पास समय क्षेत्र जाँचें।":"Negative latitude is south; negative longitude is west. Verify the timezone near borders. Search data: OpenStreetMap."}</p></div>}
  {error&&<p className="birth-place-error" role="alert">{error}</p>}
 </div>;
}
