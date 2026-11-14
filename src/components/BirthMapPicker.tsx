"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function BirthMapPicker({latitude,longitude,onPick}:{latitude:number;longitude:number;onPick:(latitude:number,longitude:number)=>void}) {
 const host=useRef<HTMLDivElement>(null);
 const callback=useRef(onPick);
 const [center]=useState({latitude:Number.isFinite(latitude)&&Math.abs(latitude)<=85?latitude:20,longitude:Number.isFinite(longitude)&&Math.abs(longitude)<=180?longitude:0});
 const [error,setError]=useState("");
 useEffect(()=>{callback.current=onPick;},[onPick]);
 useEffect(()=>{
  let disposed=false;let cleanup=()=>{};
  void import("leaflet").then(L=>{
   if(disposed||!host.current)return;
   const map=L.map(host.current,{scrollWheelZoom:false,minZoom:2,maxZoom:19}).setView([center.latitude,center.longitude],center.latitude===20&&center.longitude===0?2:12);
   const tiles=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   tiles.on("tileerror",()=>setError("Some map tiles could not load. You can still enter exact coordinates manually."));
   const marker=L.marker([center.latitude,center.longitude],{draggable:true,icon:L.divIcon({className:"birth-map-pin",html:"<span></span>",iconSize:[22,22],iconAnchor:[11,11]})}).addTo(map);
   const pick=(point:import("leaflet").LatLng)=>{const latitude=Number(Math.max(-85,Math.min(85,point.lat)).toFixed(7)),longitude=Number((((point.lng+180)%360+360)%360-180).toFixed(7));marker.setLatLng([latitude,longitude]);callback.current(latitude,longitude);};
   map.on("click",(e:import("leaflet").LeafletMouseEvent)=>pick(e.latlng));marker.on("dragend",()=>pick(marker.getLatLng()));
   cleanup=()=>map.remove();
  }).catch(()=>{if(!disposed)setError("The map could not load. Enter your coordinates manually instead.");});
  return()=>{disposed=true;cleanup();};
 },[center]);
 return <div className="birth-map-picker"><p>Click the birthplace or drag the pin. Zoom in before selecting; confirm the coordinates and timezone below. For polar locations outside this map projection, use manual coordinates.</p><div ref={host} className="birth-map-canvas" role="region" aria-label="Choose birthplace on the map"/>{error&&<p role="status">{error}</p>}</div>;
}
