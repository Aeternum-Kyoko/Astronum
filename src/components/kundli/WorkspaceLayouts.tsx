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
  const [name, setName] = useState(""); const [status, setStatus] = useState("");
  return <div className="workspace-layouts"><label>{L("Chart pane width", "कुंडली क्षेत्र की चौड़ाई")}<input aria-label={L("Chart pane width", "कुंडली क्षेत्र की चौड़ाई")} type="range" min={40} max={65} value={width} onChange={e => setWidth(Number(e.target.value))} /></label><select aria-label={L("Saved layouts", "सहेजे लेआउट")} value="" onChange={e => { const layout = saved.find(l => l.name === e.target.value); if (layout) { const { name: title, width, ...state } = layout; a.update(state); setWidth(width); setStatus(`${L("Loaded", "खोला")}: ${title}`); } }}><option value="">{L("Load a layout", "लेआउट खोलें")}</option>{saved.map(l => <option key={l.name}>{l.name}</option>)}</select><input aria-label={L("Layout name", "लेआउट नाम")} placeholder={L("Name this layout", "लेआउट का नाम")} maxLength={50} value={name} onChange={e => setName(e.target.value)} /><button type="button" disabled={!name.trim()} onClick={() => { const title = name.trim(); const persisted = save([...saved.filter(l => l.name !== title), { name: title, primary: a.primary, secondary: a.secondary, style: a.style, reference: a.reference, overlay: a.overlay, compare: a.compare, width }]); setStatus(persisted ? L("Layout saved on this device.", "लेआउट उपकरण पर सहेजा गया।") : L("Layout available for this session; device storage is unavailable.", "लेआउट इस सत्र में उपलब्ध है; उपकरण संग्रह उपलब्ध नहीं।")); setName(""); }}>{L("Save layout", "लेआउट सहेजें")}</button><span role="status" className="text-xs text-muted">{status}</span></div>;
}
