"use client";
import { useState } from "react";
import { useAnalysis } from "./AnalysisContext";
import { useDeviceStore } from "@/lib/useDeviceStore";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
type SavedLayout = { name: string; primary: NonNullable<ReturnType<typeof useAnalysis>>["primary"]; secondary: NonNullable<ReturnType<typeof useAnalysis>>["secondary"]; style: "north" | "south"; reference: NonNullable<ReturnType<typeof useAnalysis>>["reference"]; overlay: boolean; compare: boolean; width: number };
export default function WorkspaceLayouts({ chart, width, setWidth }: { chart: KundaliChart; width: number; setWidth: (width: number) => void }) {
  const a = useAnalysis()!; const L = pick(useLocale());
  const [saved, save] = useDeviceStore<SavedLayout[]>(`kundli-layouts:${chart.utcDate}`, []);
  const [name, setName] = useState(""); const [status, setStatus] = useState(""); const [open, setOpen] = useState(false);
  const load = (layout: SavedLayout) => { const { name: title, width: savedWidth, ...state } = layout; a.update(state); setWidth(savedWidth); setStatus(`${L("Loaded", "खोला")}: ${title}`); setOpen(false); };
  return <div className="workspace-layouts"><label>{L("Chart pane width", "कुंडली क्षेत्र की चौड़ाई")}<input aria-label={L("Chart pane width", "कुंडली क्षेत्र की चौड़ाई")} type="range" min={40} max={65} value={width} onChange={e => setWidth(Number(e.target.value))} /></label><div className="layout-picker"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{L("Load a layout", "लेआउट खोलें")}{saved.length > 0 && ` (${saved.length})`}</button>{open && <div role="group" aria-label={L("Saved layouts", "सहेजे लेआउट")}>{saved.length ? saved.map(layout => <button type="button" key={layout.name} onClick={() => load(layout)}>{layout.name}</button>) : <p>{L("No saved layouts yet.", "अभी कोई लेआउट सहेजा नहीं गया।")}</p>}</div>}</div><input aria-label={L("Layout name", "लेआउट नाम")} placeholder={L("Name this layout", "लेआउट का नाम")} maxLength={50} value={name} onChange={e => setName(e.target.value)} /><button type="button" disabled={!name.trim()} onClick={() => { const title = name.trim(); const persisted = save([...saved.filter(l => l.name !== title), { name: title, primary: a.primary, secondary: a.secondary, style: a.style, reference: a.reference, overlay: a.overlay, compare: a.compare, width }]); setStatus(persisted ? L("Layout saved on this device.", "लेआउट उपकरण पर सहेजा गया।") : L("Layout available for this session; device storage is unavailable.", "लेआउट इस सत्र में उपलब्ध है; उपकरण संग्रह उपलब्ध नहीं।")); setName(""); }}>{L("Save layout", "लेआउट सहेजें")}</button><span role="status" className="text-xs text-muted">{status}</span></div>;
}
