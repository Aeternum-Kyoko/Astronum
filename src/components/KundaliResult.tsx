"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { DashaPeriod } from "@/lib/astrology/dasha";
import { NAKSHATRAS, SIGNS, SIGN_SANSKRIT, ASHTAKAVARGA_PLANETS, VARGA_KEYS, type VargaKey, type AshtakavargaPlanet } from "@/lib/astrology/constants";
import { SIGN_KEYNOTE, PLANET_KEYNOTE } from "@/lib/astrology/content";
import { analyzeBhavaStrength } from "@/lib/astrology/bhavaStrength";
import { dignityColorClass } from "@/lib/astrology/dignity";
import type { DivisionalChart } from "@/lib/astrology/types";
import { MARKER_MEANING, WEAK_MARKERS, natalMarkers, planetMarkers, type Marker } from "@/lib/astrology/chartMarkers";
import { binduBand } from "@/lib/astrology/ashtakavarga";
import AshtakavargaGrid from "@/components/AshtakavargaGrid";
import ShadbalaTable from "@/components/ShadbalaTable";
import ChartDetail from "@/components/ChartDetail";
import SegmentedControl from "@/components/SegmentedControl";
import PrintReport from "@/components/PrintReport";
import AstroDashboard from "@/components/AstroDashboard";
import BasicDetails from "@/components/BasicDetails";

import MonthlyForecastPanel from "@/components/MonthlyForecastPanel";
import RudrakshaPanel from "@/components/RudrakshaPanel";
import RemediesPanel from "@/components/RemediesPanel";
import DashaExplorer from "@/components/DashaExplorer";
import { LifeReportPanel, PlanetReadingsPanel, TransitsPanel } from "@/components/ReportPanels";
import type { HeavySection, KundaliReport } from "@/lib/astrology/report";
import YogaAnalysisPanel from "@/components/YogaAnalysisPanel";
import { CareerPanel, HousesPanel, TimelinePanel } from "@/components/DeepReportPanels";
import { CharaPanel, KpPanel, LifeSectorsPanel, VimshottariDetail, YoginiPanel } from "@/components/DashaSystemsPanels";
import { AnalysisProvider, useAnalysis } from "./kundli/AnalysisContext";
import AnalysisCalendar from "./kundli/AnalysisCalendar";
import ChartWorkspace from "./kundli/ChartWorkspace";
import WorkspaceLayouts from "./kundli/WorkspaceLayouts";
import { periodsAt } from "@/lib/astrology/dashaTree";
import TimingStrip from "./kundli/TimingStrip";
import WorkspaceOverview from "./kundli/WorkspaceOverview";
import AstrologerDesk from "./kundli/AstrologerDesk";
import AstrologerCalendar from "./kundli/AstrologerCalendar";
import ReadingObservations from "./kundli/ReadingObservations";
import BirthReliabilityBadge from "./kundli/BirthReliabilityBadge";
import "./kundli/workspace.css";
import { LalKitabPanel, SpecialTablesPanel } from "@/components/AdvancedPanels";
import { nakshatraLord } from "@/lib/astrology/dasha";
import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { houseSignification, planetKeynote, signKeynote, vargaInfo } from "@/lib/astrology/content";
import { markerText } from "@/lib/chartGeometry";
import AnnualReadingPanel from "./AnnualReadingPanel";
import AshtakavargaAdvancedPanel from "./AshtakavargaAdvancedPanel";
import ReadingContextPanel from "@/components/ReadingContextPanel";
import EventJournalPanel from "./EventJournalPanel";

import CalculationDetailsPanel from "./CalculationDetailsPanel";
import BirthPrecisionPanel from "./BirthPrecisionPanel";
import ChartComparisonPanel from "./ChartComparisonPanel";
import TopicReadingPanel from "./TopicReadingPanel";
import { useDeviceStore } from "@/lib/useDeviceStore";
import VastuTool from "@/components/VastuTool";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** The kundli's sections, grouped so the page opens on a summary and each area is one tap away. */
type Tab = "Summary" | "Astrologer Workspace" | "Signal Calendar" | "Dashboard" | "Overview" | "Birth Precision" | "Event Journal" | "Calculation Details" | "Relationships" | "Wealth" | "Education" | "Property" | "Career" | "Life Report" | "Life Sectors" | "Houses" | "Planet Readings" | "Annual Reading" | "Transits" | "Monthly Forecast" | "Life Timeline" | "Dashas" | "Yogini Dasha" | "Chara Dasha" | "Compare Charts" | "D1 · Rasi Chart" | "D9 · Navamsa" | "More Vargas" | "Ashtakavarga" | "Shadbala" | "House Lords" | "Yogas & Doshas" | "KP System" | "Lal Kitab" | "Special Tables" | "Remedies" | "Rudraksha" | "Vastu & Home";

const USER_GROUPS: { name: string; tabs: Tab[] }[] = [
  { name: "Overview", tabs: ["Summary", "Life Report"] },
  { name: "Charts", tabs: ["D1 · Rasi Chart", "D9 · Navamsa", "More Vargas", "Compare Charts", "Houses", "Planet Readings", "Shadbala", "Calculation Details", "Birth Precision"] },
  { name: "Timing", tabs: ["Transits", "Dashas", "Annual Reading", "Monthly Forecast", "Life Timeline", "Yogini Dasha", "Chara Dasha"] },
  { name: "Life areas", tabs: ["Career", "Relationships", "Wealth", "Education", "Property", "Remedies"] },
];
const USER_TABS = new Set(USER_GROUPS.flatMap(group => group.tabs));

/** The heavy report sections each tab needs. */
const TAB_SECTIONS: Partial<Record<Tab, HeavySection[]>> = {
  Summary: ["timeline", "dashaDetail", "houses", "sectors", "career"],
  Houses: ["houses"],
  Career: ["career", "timeline"],
  Relationships: ["timeline"],
  Wealth: ["timeline"],
  Education: ["timeline"],
  Property: ["timeline"],
  "Life Timeline": ["timeline"],
  "Signal Calendar": ["timeline"],
  "Life Sectors": ["sectors"],
  Dashas: ["dashaDetail"],
  "Yogini Dasha": ["yogini"],
  "Chara Dasha": ["chara"],
  "KP System": ["kp"],
  "Monthly Forecast": ["monthly"],
};

/** URL-friendly names for deep links such as /kundali?tab=dashas. */
export const TAB_SLUGS: Record<string, Tab> = {
  summary: "Summary",
  workbench: "Astrologer Workspace", precision: "Birth Precision", journal: "Event Journal",
  calculations: "Calculation Details", compare: "Compare Charts",
  relationships: "Relationships", wealth: "Wealth", education: "Education", property: "Property",
  dashboard: "Dashboard",
  overview: "Overview",
  report: "Life Report",
  annual: "Annual Reading",
  monthly: "Monthly Forecast",
  planets: "Planet Readings",
  houses: "Houses",
  career: "Career",
  timeline: "Life Timeline",
  calendar: "Signal Calendar",
  sectors: "Life Sectors",
  yogini: "Yogini Dasha",
  chara: "Chara Dasha",
  kp: "KP System",
  transits: "Transits",
  rasi: "D1 · Rasi Chart",
  navamsa: "D9 · Navamsa",
  vargas: "More Vargas",
  ashtakavarga: "Ashtakavarga",
  shadbala: "Shadbala",
  dashas: "Dashas",
  yogas: "Yogas & Doshas",
  remedies: "Remedies",
  rudraksha: "Rudraksha",
  lords: "House Lords",
  lalkitab: "Lal Kitab",
  tables: "Special Tables",
  vastu: "Vastu & Home",
};

function formatDate(d: Date | string, locale?: string): string {
  return new Date(d).toLocaleDateString(locale === "hi" ? "hi-IN" : undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateShort(d: Date | string, locale?: string): string {
  return new Date(d).toLocaleDateString(locale === "hi" ? "hi-IN" : undefined, { year: "numeric", month: "short" });
}

export default function KundaliResult(props: { chart: KundaliChart; report: KundaliReport | null; initialTab?: string | null; loadSections?: (sections: HeavySection[]) => void }) {
  return <AnalysisProvider chart={props.chart}><KundaliWorkspace {...props} /></AnalysisProvider>;
}

function KundaliWorkspace({
  chart,
  report,
  initialTab,
  loadSections,
}: {
  chart: KundaliChart;
  report: KundaliReport | null;
  initialTab?: string | null;
  /** Fetches heavy report sections on demand; sections a tab needs load when it opens. */
  loadSections?: (sections: HeavySection[]) => void;
}) {
  const tr = useT();
  const locale = useLocale();
  const [savedMode, saveMode] = useDeviceStore<string>("astronum-kundli-mode", "user");
  const mode = savedMode === "astrologer" ? "astrologer" : "user";
  const [mobilePane, setMobilePane] = useState<"chart" | "reading">("chart");
  const [search, setSearch] = useState("");
  const analysis = useAnalysis()!;
  const [paneWidth, setPaneWidth] = useDeviceStore<number>("kundli-pane-width", 55);
  const cleanTab = (value: Tab): Tab => ["Astrologer Workspace", "Dashboard", "Overview"].includes(value) ? "Summary" : value;
  const initial = cleanTab((initialTab && TAB_SLUGS[initialTab]) || "Summary");
  const [chosenTab, setTabState] = useState<Tab>(initial);
  const tab = chosenTab;
  const syncedTab = useRef<Tab | null>(null);
  useEffect(() => {
    if (syncedTab.current === tab) return;
    syncedTab.current = tab;
    if (tab === "D1 · Rasi Chart" && (analysis.primary !== "D1" || analysis.overlay || analysis.compare)) analysis.update({ primary: "D1", overlay: false, compare: false });
    if (tab === "D9 · Navamsa" && (analysis.primary !== "D9" || analysis.overlay || analysis.compare)) analysis.update({ primary: "D9", overlay: false, compare: false });
    if (tab === "More Vargas" && (analysis.overlay || analysis.compare || ["D1", "D9"].includes(analysis.primary))) analysis.update({ primary: ["D1", "D9"].includes(analysis.primary) ? "D10" : analysis.primary, overlay: false, compare: false });
    if (tab === "Transits" && (analysis.primary !== "D1" || !analysis.overlay || analysis.compare)) analysis.update({ primary: "D1", reference: "lagna", overlay: true, compare: false });
  }, [tab, analysis]);
  const [visited, setVisited] = useState<Tab[]>([initial]);
  const expertGroups = [
    { name: "Case overview", tabs: ["Summary", "Life Report"] as Tab[] },
    { name: "Charts", tabs: ["D1 · Rasi Chart", "D9 · Navamsa", "More Vargas", "Compare Charts", "Houses", "Planet Readings", "House Lords", "Shadbala", "Ashtakavarga"] as Tab[] },
    { name: "Timing", tabs: ["Signal Calendar", "Transits", "Dashas", "Annual Reading", "Monthly Forecast", "Life Timeline", "Yogini Dasha", "Chara Dasha"] as Tab[] },
    { name: "Interpretation", tabs: ["Career", "Relationships", "Wealth", "Education", "Property", "Life Sectors", "Yogas & Doshas", "KP System", "Lal Kitab", "Special Tables", "Remedies", "Rudraksha", "Vastu & Home"] as Tab[] },
    { name: "Case file", tabs: ["Event Journal", "Birth Precision", "Calculation Details"] as Tab[] },
  ];
  const groups = mode === "user" ? USER_GROUPS : expertGroups;
  const activeGroup = groups.find(g => g.tabs.includes(tab)) ?? expertGroups.find(g => g.tabs.includes(tab))!;
  const [directory, setDirectory] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const setTab = (value: Tab, history = true) => {
    const t = cleanTab(value);
    setMobilePane(["D1 · Rasi Chart", "D9 · Navamsa", "More Vargas", "Compare Charts", "Transits"].includes(t) ? "chart" : "reading");
    if (!USER_TABS.has(t) && mode === "user") { saveMode("astrologer"); setModeNotice(pick(locale)("This specialist section opens in Astrologer view.", "यह विशेष अनुभाग ज्योतिषी दृश्य में खुलता है।")); }
    else setModeNotice(null);
    setVisited(current => current.includes(t) ? current : [...current, t]);
    setSearch(""); setDirectory(false); setOpenGroup(null); setTabState(t);
    if (t === "D1 · Rasi Chart") analysis.update({ primary: "D1", overlay: false, compare: false });
    if (t === "More Vargas") analysis.update({ primary: ["D1", "D9"].includes(analysis.primary) ? "D10" : analysis.primary, overlay: false, compare: false });
    if (t === "D9 · Navamsa") analysis.update({ primary: "D9", overlay: false, compare: false });
    if (t === "Transits") analysis.update({ primary: "D1", reference: "lagna", overlay: true, compare: false });
    const topicVarga: Partial<Record<Tab, VargaKey>> = { Career: "D10", Relationships: "D9", Wealth: "D2", Education: "D24", Property: "D4" };
    if (topicVarga[t]) analysis.update({ primary: "D1", secondary: topicVarga[t], compare: mode === "astrologer", overlay: false });
    if (t === "Compare Charts") analysis.update({ compare: true });
    const slug = Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === t);
    if (history && slug) {
      const url = new URL(window.location.href); url.searchParams.set("tab", slug);
      window.history.pushState(null, "", url);
    }
  };
  useEffect(() => {
    const restore = () => {
      const slug = new URL(window.location.href).searchParams.get("tab");
      const t = cleanTab((slug && TAB_SLUGS[slug]) || "Summary");
      setTabState(t); setVisited(current => current.includes(t) ? current : [...current, t]);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (mode === "user" && !USER_TABS.has(tab)) saveMode("astrologer");
  }, [mode, tab, saveMode]);
  // Load each tab's heavy sections when it's opened (the summary also prefetches what its cards show).
  useEffect(() => {
    const need = TAB_SECTIONS[tab];
    if (need?.length && report) loadSections?.(need);
  }, [tab, report, loadSections]);

  const go = (slug: string) => { if (TAB_SLUGS[slug]) setTab(TAB_SLUGS[slug]); };
  const style = analysis.style;
  const setStyle = (style: "north" | "south") => analysis.update({ style });
  const label = (t: Tab) => t === "Summary" ? tr("Overview") : t;
  const groupLabel = (name: string) => ({ "Case overview": pick(locale)("Case overview", "मामला अवलोकन"), "Case file": pick(locale)("Case file", "मामला विवरण"), Interpretation: pick(locale)("Interpretation", "व्याख्या") }[name] ?? tr(name));
  const changeMode = (value: string) => {
    if (value === mode) return;
    if (value === "user" && !USER_TABS.has(tab)) { setTab("Summary"); setModeNotice(pick(locale)("Personal view opens at Overview for this specialist section.", "इस विशेष अनुभाग से व्यक्तिगत दृश्य अवलोकन पर खुलता है।")); }
    else setModeNotice(null);
    setDirectory(false); setOpenGroup(null);
    saveMode(value);
  };
  return (
    <div className={`kundli-workspace mode-${mode}`} data-mode={mode} data-active-tab={tab}>
      <div className="print:hidden">
        <header className="workspace-header">
          <div><h2>{mode === "astrologer" ? pick(locale)("Astrologer view", "ज्योतिषी दृश्य") : pick(locale)("Your chart, explained", "आपकी कुंडली की व्याख्या")}</h2>{mode === "astrologer" && <button type="button" onClick={() => go("precision")} className="mt-2 text-xs text-gold-bright">{pick(locale)("Review birth-time precision", "जन्म-समय सटीकता देखें")}</button>}</div>
          <div className="flex flex-wrap items-center gap-3"><SegmentedControl layoutId="reading-mode" ariaLabel={pick(locale)("Reading mode: Personal shows guided readings; Astrologer shows detailed analysis tools.", "दृश्य: व्यक्तिगत में सरल व्याख्या; ज्योतिषी में विस्तृत विश्लेषण उपकरण।")} value={mode} options={[{value:"user",label:pick(locale)("Personal","व्यक्तिगत")},{value:"astrologer",label:pick(locale)("Astrologer","ज्योतिषी")}]} onChange={changeMode} />{mode === "astrologer" && <button type="button" onClick={() => window.print()} className="workspace-export">{pick(locale)("Print / Save PDF", "प्रिंट / PDF")}</button>}</div>
        </header>
        {modeNotice && <p className="workspace-mode-notice" role="status">{modeNotice}</p>}
        <div id="kundli-sections" className="workspace-navigation">
          <nav aria-label={pick(locale)("Kundli destinations", "कुंडली भाग")} className="workspace-destinations">{groups.map(g => <button type="button" key={g.name} aria-current={activeGroup.name === g.name ? "page" : undefined} onClick={() => { if (activeGroup.name === g.name) setOpenGroup(openGroup === g.name ? null : g.name); else { setTab(g.tabs[0]); setOpenGroup(g.name); } }}>{groupLabel(g.name)}</button>)}</nav><button className="workspace-find" type="button" onClick={() => { setDirectory(!directory); setOpenGroup(null); }} aria-expanded={directory}>{pick(locale)("All tools", "सभी उपकरण")}</button>
        </div>
        <AnalysisCalendar compact />
        {directory && <div className="workspace-directory"><label><span className="sr-only">{pick(locale)("Find a section", "भाग खोजें")}</span><input autoFocus type="search" className="input w-full" value={search} onChange={e => setSearch(e.target.value)} placeholder={pick(locale)("Search charts, life areas, and tools", "कुंडलियाँ, जीवन क्षेत्र और उपकरण खोजें")} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{groups.map(g => <section key={g.name}><h3 className="mb-2 text-sm text-cream">{groupLabel(g.name)}</h3>{g.tabs.filter(t => `${t} ${tr(t)}`.toLowerCase().includes(search.toLowerCase())).map(t => <button key={t} type="button" onClick={() => setTab(t)} className="block py-2 text-left text-xs text-muted hover:text-gold-bright">{label(t)}</button>)}</section>)}</div></div>}
        {tab !== "Summary" && <div className="workspace-section-heading"><div><span>{groupLabel(activeGroup.name)}</span><h3>{label(tab)}</h3></div><button type="button" aria-expanded={openGroup === activeGroup.name} aria-controls={openGroup === activeGroup.name ? "workspace-tool-choices" : undefined} onClick={() => setOpenGroup(openGroup === activeGroup.name ? null : activeGroup.name)}>{openGroup === activeGroup.name ? pick(locale)("Close tools", "उपकरण बंद करें") : pick(locale)("Browse tools", "उपकरण देखें")}</button></div>}
        {openGroup === activeGroup.name && <nav id="workspace-tool-choices" className="workspace-tool-choices" aria-label={pick(locale)("Choose a tool", "उपकरण चुनें")}>{activeGroup.tabs.map(t => <button type="button" key={t} onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined}>{label(t)}</button>)}</nav>}
        {mode === "astrologer" && !["Summary", "Life Report", "Signal Calendar"].includes(tab) && <WorkspaceLayouts chart={chart} width={paneWidth} setWidth={setPaneWidth} />}
        {tab !== "Summary" && tab !== "Life Report" && tab !== "Signal Calendar" && <div className="mobile-pane-control" role="group" aria-label={pick(locale)("Workspace view", "कार्यक्षेत्र दृश्य")}><button type="button" aria-pressed={mobilePane === "chart"} onClick={() => setMobilePane("chart")}>{pick(locale)("Chart", "कुंडली")}</button><button type="button" aria-pressed={mobilePane === "reading"} onClick={() => setMobilePane("reading")}>{pick(locale)("Reading & evidence", "व्याख्या और प्रमाण")}</button></div>}
        <div data-mobile-pane={analysis.inspector.open ? "chart" : mobilePane} className="workspace-body" data-section={tab === "Summary" ? "overview" : tab === "Signal Calendar" ? "calendar" : tab === "Life Report" && mode === "user" ? "report" : undefined} style={{ "--chart-pane-width": `${Math.min(65, Math.max(40, paneWidth))}%` } as React.CSSProperties}>
          {(tab !== "Summary" && tab !== "Signal Calendar" && (mode === "astrologer" || tab !== "Life Report")) && <aside className="workspace-canvas"><ChartWorkspace chart={chart} mode={mode} go={go} transitOnly={tab === "Transits"} />{(mode === "astrologer" || activeGroup.name === "Timing") && <TimingStrip chart={chart} go={go} mode={mode} />}</aside>}
          <main className="workspace-reading" aria-label={pick(locale)("Reading and analysis", "व्याख्या और विश्लेषण")}>
          {visited.map(panelTab => <div className="reading-section" data-reading={panelTab} key={panelTab} hidden={panelTab !== tab}>
              {panelTab === "Transits" && <><TransitsPanel report={report} chart={chart} detailed={mode === "astrologer"} /><div className="mt-6"><ReadingObservations chart={chart} /></div></>}
              {panelTab === "Summary" && (mode === "astrologer" ? <AstrologerDesk chart={chart} go={go} /> : <WorkspaceOverview chart={chart} go={go} />)}
              {panelTab === "Signal Calendar" && <AstrologerCalendar chart={chart} report={report} go={go} />}
              {panelTab === "Event Journal" && <EventJournalPanel chart={chart} />}
              {panelTab === "Calculation Details" && <CalculationDetailsPanel chart={chart} />}
              {panelTab === "Birth Precision" && <BirthPrecisionPanel chart={chart} />}
              {panelTab === "Compare Charts" && <ChartComparisonPanel chart={chart} />}
              {panelTab === "Relationships" && <TopicReadingPanel chart={chart} report={report} topic="relationships" go={go} />}
              {panelTab === "Wealth" && <TopicReadingPanel chart={chart} report={report} topic="wealth" go={go} />}
              {panelTab === "Education" && <TopicReadingPanel chart={chart} report={report} topic="education" go={go} />}
              {panelTab === "Property" && <TopicReadingPanel chart={chart} report={report} topic="property" go={go} />}
              {panelTab === "Dashboard" && <AstroDashboard chart={chart} />}
              {panelTab === "Overview" && <OverviewTab chart={chart} />}
              {panelTab === "Lal Kitab" && <LalKitabPanel chart={chart} />}
              {panelTab === "Special Tables" && <SpecialTablesPanel chart={chart} />}
              {panelTab === "Annual Reading" && <AnnualReadingPanel key={chart.utcDate} chart={chart} active={panelTab === tab} />}
              {panelTab === "Monthly Forecast" && <MonthlyForecastPanel report={report} />}
              {panelTab === "Life Report" && <LifeReportPanel report={report} />}
              {panelTab === "Planet Readings" && <PlanetReadingsPanel report={report} />}
              {panelTab === "Houses" && <HousesPanel report={report} />}
              {panelTab === "Career" && <><TopicReadingPanel chart={chart} report={report} topic="career" go={go} /><details className="mt-6"><summary className="cursor-pointer text-gold-bright">{pick(locale)("Detailed career report", "विस्तृत करियर रिपोर्ट")}</summary><CareerPanel report={report} /></details></>}
              {panelTab === "Life Timeline" && <TimelinePanel report={report} />}
              {panelTab === "Life Sectors" && <LifeSectorsPanel report={report} />}
              {panelTab === "Yogini Dasha" && <YoginiPanel report={report} />}
              {panelTab === "Chara Dasha" && <CharaPanel report={report} />}
              {panelTab === "KP System" && <KpPanel report={report} />}

              {panelTab === "Vastu & Home" && <VastuTool locale={locale} chart={chart} transits={report?.transits} />}
              {panelTab === "D1 · Rasi Chart" && <div>{mode === "astrologer" && <PlanetTable chart={chart} />}<ChartDetail vargaKey="D1" ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} natal={chart} />{mode === "user" && <details className="mt-6"><summary className="cursor-pointer text-gold-bright">{pick(locale)("Planet positions and degrees", "ग्रह स्थितियाँ और अंश")}</summary><PlanetTable chart={chart} /></details>}<details className="mt-6"><summary className="cursor-pointer text-gold-bright">{pick(locale)("House cusps and Bhava Chalit", "भाव-संधि और भाव चलित")}</summary><BhavaTable chart={chart} /></details></div>}
              {panelTab === "D9 · Navamsa" && (
                <VargaTab
                  chart={chart}
                  title="D9"
                  blurb={vargaInfo("D9", locale).blurb}
                  divisionalChart={chart.divisionalCharts.D9}
                />
              )}
              {panelTab === "More Vargas" && <MoreVargasTab chart={chart} go={go} />}
              {panelTab === "Ashtakavarga" && <AshtakavargaTab chart={chart} style={style} setStyle={setStyle} />}
              {panelTab === "Shadbala" && (
                <div>
                  <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
                    {tr("Shadbala weighs each planet's overall classical strength across six components — a planet with low Shadbala is read as needing support from the rest of the chart to deliver its significations fully.")}
                  </p>
                  <div className="mt-8">
                    <ShadbalaTable shadbala={chart.shadbala} />
                  </div>
                </div>
              )}
              {panelTab === "Dashas" && <DashasTab chart={chart} report={report} />}
              {panelTab === "Yogas & Doshas" && <YogasDoshasTab chart={chart} />}
              {panelTab === "Remedies" && <RemediesPanel chart={chart} />}
              {panelTab === "Rudraksha" && <RudrakshaPanel chart={chart} locale={locale} />}
              {panelTab === "House Lords" && <HouseLordsTab chart={chart} />}
              {mode === "astrologer" && <ReadingContextPanel chart={chart} report={report} section={panelTab} go={go} />}
          </div>)}
          </main>
        </div>

        {locale === "hi" ? (
          <p className="mt-16 text-center text-xs text-muted">
            राशियाँ निरयण (सायन नहीं) राशिचक्र से दिखाई गई हैं। यह फल शास्त्रीय नियमों से बना है और एक आरंभ-बिंदु है, अंतिम निर्णय नहीं। आपके लिए
            विशेष व्याख्या हेतु{" "}
            <a href="/consultation" className="text-gold-bright hover:text-gold">
              व्यक्तिगत परामर्श बुक करें
            </a>
            ।
          </p>
        ) : (
          <p className="mt-16 text-center text-xs text-muted">
            Signs shown use the sidereal (Nirayana) zodiac —{" "}
            {SIGN_SANSKRIT[chart.ascendant.signIndex]} is the Sanskrit name for {chart.ascendant.sign}. This
            reading is generated from classical rules and is meant as a starting point, not a final word.{" "}
            <a href="/consultation" className="text-gold-bright hover:text-gold">
              Book a personal reading
            </a>{" "}
            for interpretation specific to you.
          </p>
        )}
      </div>

      <div className="hidden print:block">
        <PrintReport chart={chart} />
      </div>
    </div>
  );
}

function StyleToggle({ style, setStyle }: { style: "north" | "south"; setStyle: (s: "north" | "south") => void }) {
  const tr = useT();
  return (
    <div className="flex justify-center">
      <SegmentedControl
        layoutId="chart-style-toggle"
        value={style}
        onChange={setStyle}
        options={[
          { value: "north", label: tr("North Indian") },
          { value: "south", label: tr("South Indian") },
        ]}
      />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-edge rounded-2xl p-7 ${className}`}>
      {children}
    </div>
  );
}

const LIFE_AREA_LABEL_HI: Partial<Record<number, string>> = {
  1: "आपका आत्मबोध और जीवन-शक्ति",
  4: "घर और भावनात्मक आधार",
  5: "संतान और रचनात्मकता",
  7: "संबंध और साझेदारी",
  9: "भाग्य और उच्च शिक्षा",
  10: "करियर और प्रतिष्ठा",
};

const LIFE_AREA_LABEL: Partial<Record<number, string>> = {
  1: "your sense of self and vitality",
  4: "home and emotional foundation",
  5: "children and creativity",
  7: "relationships and partnership",
  9: "fortune and higher learning",
  10: "career and public standing",
};

/**
 * Each life-area label already contains its own "and" (e.g. "home and
 * emotional foundation"), so gluing two together with a bare "and"/","
 * reads as one run-on list instead of two distinct areas — "along with"
 * keeps the two-item case (the only case this is actually called with)
 * unambiguous; longer lists fall back to semicolons for the same reason.
 */
function joinWithAnd(items: string[], hi = false): string {
  if (items.length <= 1) return items.join("");
  if (hi) return items.join(" और साथ ही ");
  if (items.length === 2) return `${items[0]}, along with ${items[1]}`;
  return `${items.slice(0, -1).join("; ")}; and ${items[items.length - 1]}`;
}

function OverviewTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const hi = locale === "hi";
  const P = pick(locale);
  const name = (x: string) => term(locale, x);
  const areas = hi ? LIFE_AREA_LABEL_HI : LIFE_AREA_LABEL;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const presentYogas = chart.yogas.filter((y) => y.present);
  const presentDoshas = chart.doshas.filter((d) => d.present);

  const pillarStrength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala)
    .filter((b) => LIFE_AREA_LABEL[b.house])
    .sort((a, b) => b.score - a.score);
  const strongestAreas = joinWithAnd(pillarStrength.slice(0, 2).map((b) => areas[b.house]!), hi);
  const weakestAreas = joinWithAnd(
    [...pillarStrength]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((b) => areas[b.house]!),
    hi
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-3">
        <BasicDetails chart={chart} />
      </div>
      <SummaryCard title={tr("Ascendant (Lagna)")} sign={name(chart.ascendant.sign)}>
        {P(`Your outward personality and life direction lean ${SIGN_KEYNOTE[chart.ascendant.sign]}.`, `आपका बाहरी व्यक्तित्व और जीवन की दिशा ${signKeynote(chart.ascendant.sign, "hi")} की ओर झुकी है।`)}
      </SummaryCard>
      <SummaryCard title={tr("Moon Sign (Rashi)")} sign={name(moon.sign)}>
        {P(`Your inner emotional world tends to be ${SIGN_KEYNOTE[moon.sign]}.`, `आपका भीतरी भावनात्मक संसार ${signKeynote(moon.sign, "hi")} रहता है।`)}
      </SummaryCard>
      <SummaryCard title={tr("Sun Sign")} sign={name(sun.sign)}>
        {P(`Your core sense of identity is ${SIGN_KEYNOTE[sun.sign]}.`, `आपकी मूल पहचान ${signKeynote(sun.sign, "hi")} है।`)}
      </SummaryCard>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Where You Are Now")}</h3>
        {chart.currentDasha && hi ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            आप <span className="text-cream">{name(chart.currentDasha.lord)} महादशा</span>
            {chart.currentAntardasha && <> → <span className="text-cream">{name(chart.currentAntardasha.lord)} अंतर्दशा</span></>}
            {chart.currentPratyantardasha && <> → <span className="text-cream">{name(chart.currentPratyantardasha.lord)} प्रत्यंतर दशा</span></>} में
            हैं, जो {formatDate(chart.currentPratyantardasha?.end ?? chart.currentAntardasha?.end ?? chart.currentDasha.end, "hi")} तक सक्रिय है।{" "}
            {name(chart.currentDasha.lord)} की दशा सामान्यतः {planetKeynote(chart.currentDasha.lord, "hi")} के विषय सामने लाती है
            {chart.currentAntardasha && chart.currentAntardasha.lord !== chart.currentDasha.lord && (
              <>, जिन्हें {name(chart.currentAntardasha.lord)} {planetKeynote(chart.currentAntardasha.lord, "hi")} के माध्यम से ढालते हैं</>
            )}
            ।
          </p>
        ) : chart.currentDasha ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            You are running <span className="text-cream">{chart.currentDasha.lord} Mahadasha</span>
            {chart.currentAntardasha && (
              <>
                {" "}
                → <span className="text-cream">{chart.currentAntardasha.lord} Antardasha</span>
              </>
            )}
            {chart.currentPratyantardasha && (
              <>
                {" "}
                → <span className="text-cream">{chart.currentPratyantardasha.lord} Pratyantardasha</span>
              </>
            )}
            , active until{" "}
            {formatDate(chart.currentPratyantardasha?.end ?? chart.currentAntardasha?.end ?? chart.currentDasha.end)}.{" "}
            {chart.currentDasha.lord} periods generally bring themes of {PLANET_KEYNOTE[chart.currentDasha.lord]} to
            the foreground
            {chart.currentAntardasha && chart.currentAntardasha.lord !== chart.currentDasha.lord && (
              <>, filtered through {chart.currentAntardasha.lord}&rsquo;s focus on {PLANET_KEYNOTE[chart.currentAntardasha.lord]}</>
            )}
            .
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">{tr("No active dasha period found for the current date.")}</p>
        )}
        {chart.sadeSati.active && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-cream">
            {hi ? (
              <>
                आप अभी साढ़े साती के <span className="font-semibold text-gold-bright">{({ rising: "आरंभिक", peak: "मध्य (चरम)", setting: "अंतिम" } as Record<string, string>)[chart.sadeSati.phase ?? "peak"]}</span>{" "}
                चरण में हैं — जन्म चंद्र के आसपास की राशियों से शनि का गोचर।
              </>
            ) : (
              <>
                You are currently in the <span className="font-semibold text-gold-bright">{chart.sadeSati.phase}</span> phase of Sade Sati — Saturn&rsquo;s transit through the signs around your natal Moon.
              </>
            )}
          </p>
        )}
      </Card>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Planet Strength")}</h3>
        <p className="mt-2 text-sm text-muted">{tr("Each planet's Shadbala rupas against what it classically needs to act at full strength.")}</p>
        <div className="mt-5 space-y-3">
          {chart.shadbala.map((s) => {
            const pct = Math.max(0, Math.min(100, (s.rupas / s.requiredRupas) * 100));
            return (
              <div key={s.planet}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cream">{name(s.planet)}</span>
                  <span className={s.isStrong ? "text-gold-bright" : "text-rose"}>
                    {s.rupas.toFixed(2)} / {s.requiredRupas} {tr("rupas")}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full border border-border/50 bg-ink-deep/80">
                  <div className={`h-full rounded-full ${s.isStrong ? "bg-gold" : "bg-rose/70"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {hi ? (
            <>
              सभी नौ ग्रहों को देखते हुए <span className="text-cream">{strongestAreas}</span> आपके सबसे मज़बूत समर्थित क्षेत्र हैं, जबकि{" "}
              <span className="text-cream">{weakestAreas}</span> पर सबसे सचेत ध्यान की ज़रूरत है।
            </>
          ) : (
            <>
              Reading across all nine planets, <span className="text-cream">{strongestAreas}</span> come through as your most solidly supported areas, while{" "}
              <span className="text-cream">{weakestAreas}</span> could use the most conscious attention.
            </>
          )}
        </p>
      </Card>

      <Card>
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Yogas Present")}</h3>
        {presentYogas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("None of the classical combinations checked are present in this chart.")}</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-cream">
            {presentYogas.map((y) => (
              <li key={y.name}>• {y.name}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="md:col-span-2">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Doshas Flagged")}</h3>
        {presentDoshas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("None of the doshas checked are indicated in this chart.")}</p>
        ) : (
          <ul className="mt-4 space-y-1.5 text-sm text-cream">
            {presentDoshas.map((d) => (
              <li key={d.name}>• {d.name}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">{tr("See the “Yogas & Doshas” tab for the reasoning behind each.")}</p>
      </Card>
    </div>
  );
}

function SummaryCard({ title, sign, children }: { title: string; sign: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gold-bright">{sign}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>
    </Card>
  );
}

function PlanetTable({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const markers = natalMarkers(chart);
  const ascNakshatraIndex = Math.floor(chart.ascendant.siderealLongitude / (360 / 27));

  return (
    <div className="card-edge self-start overflow-x-auto rounded-2xl">
      <table className="w-full text-sm font-tabular">
        <thead>
          <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
            <th className="px-3 py-3">{tr("Planet")}</th>
            <th className="px-3 py-3">{tr("Sign")}</th>
            <th className="px-3 py-3">{tr("Degree")}</th>
            <th className="px-3 py-3">{tr("Nakshatra")}</th>
            <th className="px-3 py-3">{tr("Nak. lord")}</th>
            <th className="px-3 py-3">{tr("House")}</th>
            <th className="px-3 py-3">{tr("Dignity")}</th>
          </tr>
        </thead>
        <tbody className="whitespace-nowrap">
          <tr className="border-b border-border/50 bg-gold/5">
            <td className="px-3 py-2.5 font-medium text-gold-bright">{tr("Ascendant")}</td>
            <td className="px-3 py-2.5 text-muted">{nm(chart.ascendant.sign)}</td>
            <td className="px-3 py-2.5 text-muted">{formatDms(chart.ascendant.degreeInSign)}</td>
            <td className="px-3 py-2.5 text-muted">
              {nm(NAKSHATRAS[ascNakshatraIndex])}
            </td>
            <td className="px-3 py-2.5 text-muted">{nm(nakshatraLord(ascNakshatraIndex))}</td>
            <td className="px-3 py-2.5 text-muted">1</td>
            <td className="px-3 py-2.5 text-muted">—</td>
          </tr>
          {chart.planets.map((p) => {
            const marks = markers[p.planet];
            return (
              <tr key={p.planet} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2.5 font-medium text-cream">
                  <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                    {nm(p.planet)}
                  </Link>
                  {[...marks].map((m, i) => (
                    <abbr
                      key={i}
                      title={tr(MARKER_MEANING[m as Marker])}
                      className={`ml-1 text-xs font-semibold no-underline ${WEAK_MARKERS.has(m as Marker) || m === "R" ? "text-rose" : "text-gold-bright"}`}
                    >
                      {markerText(m, locale)}
                    </abbr>
                  ))}
                </td>
                <td className="px-3 py-2.5 text-muted">{nm(p.sign)}</td>
                <td className="px-3 py-2.5 text-muted">{formatDms(p.degreeInSign)}</td>
                <td className="px-3 py-2.5 text-muted">
                  {nm(p.nakshatra)} <span className="text-xs">({p.pada})</span>
                </td>
                <td className="px-3 py-2.5 text-muted">{nm(nakshatraLord(p.nakshatraIndex))}</td>
                <td className="px-3 py-2.5 text-muted">{p.house}</td>
                <td className="px-3 py-2.5">
                  {p.dignity ? (
                    <span className={dignityColorClass(p.dignity)}>{nm(p.dignity)}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border/50 px-3 py-2.5 text-xs text-muted">
        <span className="text-gold-bright">↑</span> {tr("exalted")}, <span className="text-rose">↓</span> {tr("debilitated")},{" "}
        <span className="text-rose">{markerText("R", locale)}</span> {tr("retrograde")}, <span className="text-rose">{markerText("C", locale)}</span> {tr("combust")},{" "}
        <span className="text-gold-bright">{markerText("V", locale)}</span> {tr("vargottama")}. {tr("Nakshatra pada in brackets.")}
      </p>
    </div>
  );
}

/** Sripati bhava cusps: where each house begins (Arambha), peaks (Madhya) and ends (Viram). */
function BhavaTable({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const at = (lon: number) => {
    const signIndex = Math.floor(lon / 30) % 12;
    return `${nm(SIGNS[signIndex])} ${formatDms(lon - signIndex * 30)}`;
  };
  return (
    <div className="card-edge overflow-x-auto rounded-2xl">
      <table className="w-full text-sm font-tabular">
        <caption className="px-4 pt-4 text-left">
          <span className="block font-semibold text-cream">{tr("Bhava Chalit cusps")}</span>
          <span className="text-xs text-muted">{tr("Each bhava runs from its Arambha (start, the sandhi or junction) through its Madhya (mid-point, the cusp) to its Viram (end) — the next house's Arambha.")}</span>
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
            <th className="px-4 py-3">{tr("Bhava")}</th>
            <th className="px-4 py-3">{tr("Arambha (start)")}</th>
            <th className="px-4 py-3">{tr("Madhya (mid)")}</th>
            <th className="px-4 py-3">{tr("Viram (end)")}</th>
            <th className="px-4 py-3">{tr("Planets")}</th>
          </tr>
        </thead>
        <tbody className="whitespace-nowrap">
          {chart.bhavas.map((b, i) => {
            const next = chart.bhavas[(i + 1) % 12];
            const inside = chart.chalitHouses.filter((c) => c.house === b.house).map((c) => c.planet);
            return (
              <tr key={b.house} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-cream">{b.house}</td>
                <td className="px-4 py-2.5 text-muted">{at(b.start)}</td>
                <td className="px-4 py-2.5 text-cream">{at(b.madhya)}</td>
                <td className="px-4 py-2.5 text-muted">{at(next.start)}</td>
                <td className="px-4 py-2.5 text-muted">{inside.map(nm).join(", ") || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 12.5083 → 12°30′30″ */
function formatDms(deg: number): string {
  const totalSeconds = Math.round(deg * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return `${d}°${String(m).padStart(2, "0")}′${String(sec).padStart(2, "0")}″`;
}

function VargaTab({
  chart,
  title,
  blurb,
  divisionalChart,
}: {
  chart: KundaliChart;
  title: VargaKey;
  blurb: string;
  divisionalChart: DivisionalChart;
}) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const inVarga = new Map(divisionalChart.planets.map((p) => [p.planet, p]));
  const markers = planetMarkers(chart, (pl) => inVarga.get(pl)!.signIndex, (pl) => inVarga.get(pl)!.retrograde, { vargottama: title === "D9" });
  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-3"><BirthReliabilityBadge chart={chart} varga={title} /></div>
      <div className="mt-6">
        <div className="card-edge overflow-x-auto rounded-2xl">
          <table className="w-full text-sm font-tabular">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3">{tr("Planet")}</th>
                <th className="px-4 py-3">{title} {tr("Sign")}</th>
                <th className="px-4 py-3">{title} {tr("House")}</th>
              </tr>
            </thead>
            <tbody>
              {divisionalChart.planets.map((p) => (
                <tr key={p.planet} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-cream">
                    <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                      {nm(p.planet)}
                    </Link>
                    {markers[p.planet] && <span className="ml-1.5 text-xs font-semibold text-gold-bright">{[...markers[p.planet]].map((m) => markerText(m, locale)).join("")}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{nm(p.sign)}</td>
                  <td className="px-4 py-3 text-muted">{p.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartDetail vargaKey={title} ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={divisionalChart.planets} natal={chart} />
    </div>
  );
}

function MoreVargasTab({
  chart,
  go,
}: {
  chart: KundaliChart;
  go: (slug: string) => void;
}) {
  const locale = useLocale();
  const L = pick(locale);
  const analysis = useAnalysis()!;
  const [query, setQuery] = useState("");
  const selected: VargaKey = analysis.primary === "D1" || analysis.primary === "D9" ? "D10" : analysis.primary;
  const info = vargaInfo(selected, locale);
  const common: VargaKey[] = ["D1", "D9", "D10", "D2", "D4", "D7", "D24"];
  const ordered = [...common, ...VARGA_KEYS.filter(key => !common.includes(key))];
  const filtered = ordered.filter(key => `${key} ${vargaInfo(key, locale).title} ${vargaInfo(key, locale).blurb}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
  const choose = (key: VargaKey) => {
    if (key === "D1") return go("rasi");
    if (key === "D9") return go("navamsa");
    analysis.update({ primary: key, reference: "lagna", overlay: false, compare: false });
  };
  const card = (key: VargaKey) => { const item = vargaInfo(key, locale); return <button type="button" key={key} aria-pressed={selected === key} onClick={() => choose(key)}><span className="varga-code">{key}</span><span className="varga-copy"><strong>{item.title}</strong><small>{item.blurb}</small></span><span aria-hidden="true">↗</span></button>; };

  return (
    <div>
      <section className="varga-library" aria-label={L("Divisional chart library", "वर्ग कुंडली संग्रह")}>
        <div className="varga-library-heading"><div><h3>{L("Explore all 16 charts", "सभी 16 कुंडलियाँ देखें")}</h3><p>{L("Choose a chart to study its positions and reading.", "स्थितियाँ और व्याख्या देखने के लिए कुंडली चुनें।")}</p></div><label><span className="sr-only">{L("Search charts", "कुंडलियाँ खोजें")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={L("Search D10, career…", "D10, करियर खोजें…")} /></label></div>
        {query ? <div className="varga-library-grid">{filtered.map(card)}</div> : <><div className="varga-library-grid">{common.map(card)}</div><details className="varga-library-more"><summary>{L("Explore the remaining nine charts", "शेष नौ कुंडलियाँ देखें")} <span aria-hidden="true">⌄</span></summary><div className="varga-library-grid">{ordered.filter(key => !common.includes(key)).map(card)}</div></details></>}
        {filtered.length === 0 && <p className="varga-empty">{L("No chart matches this search.", "इस खोज से कोई कुंडली नहीं मिली।")}</p>}
      </section>
      <h3 className="mt-8 text-lg font-semibold text-cream">
        <Link href={`/learn/divisional-charts#${selected}`} className="hover:text-gold">
          {selected} · {info.title}
        </Link>
      </h3>
      <div className="mt-4">
        <VargaTab
          chart={chart}
          title={selected}
          blurb={info.blurb}
          divisionalChart={chart.divisionalCharts[selected]}
        />
      </div>
    </div>
  );
}

function AshtakavargaTab({ chart, style, setStyle }: { chart: KundaliChart; style: "north" | "south"; setStyle: (s: "north" | "south") => void }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const [selected, setSelected] = useState<AshtakavargaPlanet | "Sarva">("Sarva");
  const bindus = selected === "Sarva" ? chart.ashtakavarga.sarva : chart.ashtakavarga.bhinna[selected];

  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {tr("Ashtakavarga scores each sign's benefic points (bindus) contributed by the seven classical planets and the Ascendant — a classical technique for weighing which signs, and later in transit which years, carry more support.")}
      </p>
      <div className="mt-6 flex justify-center">
        <SegmentedControl
          layoutId="ashtakavarga-picker"
          value={selected}
          onChange={setSelected}
          options={(["Sarva", ...ASHTAKAVARGA_PLANETS] as const).map((key) => ({ value: key, label: key === "Sarva" ? tr("Sarva") : nm(key) }))}
        />
      </div>
      <div className="mt-6">
        <StyleToggle style={style} setStyle={setStyle} />
      </div>
      <div className="mt-6">
        <AshtakavargaGrid
          bindus={bindus}
          ascendantSignIndex={chart.ascendant.signIndex}
          label={selected === "Sarva" ? tr("Sarvashtakavarga") : `${nm(selected)} ${tr("Bhinna")}`}
          style={style}
        />
      </div>
      <AshtakavargaHouseTable chart={chart} bindus={bindus} selected={selected} />
      <AshtakavargaAdvancedPanel chart={chart} />
    </div>
  );
}

function AshtakavargaHouseTable({ chart, bindus, selected }: { chart: KundaliChart; bindus: number[]; selected: AshtakavargaPlanet | "Sarva" }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const sarva = selected === "Sarva";
  const verdict = (n: number) => ({ high: "Strong", low: "Weak", mid: "Average" })[binduBand(n, sarva)];
  const hi = locale === "hi";
  return (
    <div className="card-edge mx-auto mt-8 max-w-3xl overflow-x-auto rounded-2xl p-5">
      <p className="text-sm text-muted">
        {sarva
          ? pick(locale)("Raw SAV: 30 or more is supporting, 25–29 mixed, and 24 or fewer demanding. These are reference bands, not event probabilities.", "मूल SAV: 30 या अधिक सहायक, 25–29 मिश्रित और 24 या कम कठिन हैं। ये मानक हैं, घटना के प्रतिशत नहीं।")
          : hi
            ? `${nm(selected)} मूल BAV: 5–8 सहायक, 4 मिश्रित और 0–3 कठिन हैं। ये गोचर-सहारे के मानक हैं, घटना की गारंटी नहीं।`
            : `${selected} raw BAV: 5–8 supporting, 4 mixed, and 0–3 demanding. These describe transit support, not guaranteed outcomes.`}
      </p>
      <table className="mt-3 w-full min-w-[28rem] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("House")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Sign")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Bindus")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Verdict")}</th>
            <th scope="col" className="py-2 font-semibold">{tr("Signifies")}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => {
            const sign = (chart.ascendant.signIndex + i) % 12;
            const n = bindus[sign];
            const v = verdict(n);
            return (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">{i + 1}</td>
                <td className="py-2 pr-3 text-muted">{nm(SIGNS[sign])}</td>
                <td className="font-tabular py-2 pr-3 text-cream">{n}</td>
                <td className={`py-2 pr-3 font-semibold ${v === "Strong" ? "text-gold-bright" : v === "Weak" ? "text-rose" : "text-muted"}`}>{nm(v)}</td>
                <td className="py-2 text-xs text-muted">{houseSignification(i + 1, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  return (
    <li className={`flex justify-between border-b border-border/40 px-1 py-2.5 last:border-0 ${isCurrent ? "text-gold-bright" : "text-muted"}`}>
      <span className={isCurrent ? "font-semibold" : ""}>{nm(period.lord)}</span>
      <span>
        {formatDateShort(period.start, locale)} – {formatDateShort(period.end, locale)}
      </span>
    </li>
  );
}

function ExpandableAntardashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const [open, setOpen] = useState(false);
  const children = period.subPeriods ?? [];

  return (
    <li className="border-b border-border/40 px-1 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between py-2.5 text-left ${isCurrent ? "text-gold-bright" : "text-muted"}`}
      >
        <span className={`flex items-center gap-1.5 ${isCurrent ? "font-semibold" : ""}`}>
          <span className="inline-block text-[10px] transition-transform" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
            ▸
          </span>
          {nm(period.lord)}
        </span>
        <span>
          {formatDateShort(period.start, locale)} – {formatDateShort(period.end, locale)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="overflow-hidden pl-5"
          >
            {children.map((sub, i) => (
              <li key={i} className="flex justify-between border-t border-border/20 py-2 text-xs text-muted first:border-t-0">
                <span>{nm(sub.lord)}</span>
                <span>
                  {formatDateShort(sub.start, locale)} – {formatDateShort(sub.end, locale)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function DashasTab({ chart, report }: { chart: KundaliChart; report: KundaliReport | null }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const analysis = useAnalysis();
  const running = periodsAt(chart.dashas, analysis?.at ?? new Date(), 3);
  const moon = chart.planets.find(p => p.planet === "Moon")!;
  const saturn = analysis?.transits.find(p => p.planet === "Saturn");
  const saturnDistance = saturn ? (saturn.signIndex - moon.signIndex + 12) % 12 : null;
  const selectedMaha = chart.dashas.find(d => new Date(d.start).getTime() === running[0]?.start.getTime());
  // Match periods by start time rather than object identity.
  const same = (a: DashaPeriod, b: DashaPeriod | null) => !!b && new Date(a.start).getTime() === new Date(b.start).getTime() && a.lord === b.lord;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DashaExplorer chart={chart} />
      <VimshottariDetail report={report} />
      <Card>
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Vimshottari Mahadasha Timeline")}</h3>
        <p className="mt-2 text-xs text-muted">{tr("The 120-year Vimshottari cycle, starting from your Moon's nakshatra at birth.")}</p>
        <ul className="mt-5 text-sm">
          {chart.dashas.map((d, i) => (
            <DashaRow key={i} period={d} isCurrent={same(d, running[0] ?? null)} />
          ))}
        </ul>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">
            {locale === "hi" ? `${selectedMaha ? nm(selectedMaha.lord) : "—"} महादशा की अंतर्दशाएँ` : `Antardashas within ${selectedMaha?.lord ?? "—"} Mahadasha`}
          </h3>
          <p className="mt-2 text-xs text-muted">{tr("Sub-periods of the Mahadasha you are currently running — click one to reveal its Pratyantardashas.")}</p>
          <ul className="mt-5 text-sm">
            {(selectedMaha?.subPeriods ?? []).map((d, i) => (
              <ExpandableAntardashaRow key={i} period={d} isCurrent={same(d, running[1] ?? null)} />
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Sade Sati")}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">{analysis ? saturnDistance === 11 ? pick(locale)("Rising phase at the analysis date: Saturn is in the sign before your natal Moon.", "विश्लेषण तिथि पर प्रथम चरण: शनि जन्म चंद्र से पिछली राशि में हैं।") : saturnDistance === 0 ? pick(locale)("Peak phase at the analysis date: Saturn is in your natal Moon sign.", "विश्लेषण तिथि पर मध्य चरण: शनि जन्म चंद्र राशि में हैं।") : saturnDistance === 1 ? pick(locale)("Setting phase at the analysis date: Saturn is in the sign after your natal Moon.", "विश्लेषण तिथि पर अंतिम चरण: शनि जन्म चंद्र से अगली राशि में हैं।") : pick(locale)("Sade Sati is not active at the analysis date.", "विश्लेषण तिथि पर साढ़ेसाती सक्रिय नहीं।") : chart.sadeSati.description}</p>
        </Card>
      </div>

    </div>
  );
}

function YogasDoshasTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const sortedYogas = [...chart.yogas].sort((a, b) => Number(b.present) - Number(a.present));
  const sortedDoshas = [...chart.doshas].sort((a, b) => Number(b.present) - Number(a.present));

  return (
    <div className="space-y-6">
      <YogaAnalysisPanel chart={chart} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Other classical yogas")}</h3>
          <ul className="mt-5 space-y-5">
            {sortedYogas.map((y) => (
              <li key={y.name}>
                <p className="text-sm font-semibold text-cream">
                  {y.name} — <span className={y.present ? "text-gold-bright" : "text-muted"}>{y.present ? tr("Present") : tr("Not present")}</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{y.description}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Doshas")}</h3>
          <ul className="mt-5 space-y-5">
            {sortedDoshas.map((d) => (
              <li key={d.name}>
                <p className="text-sm font-semibold text-cream">
                  {d.name} —{" "}
                  <span className={d.present ? "text-rose" : d.cancelled ? "text-gold-bright" : "text-muted"}>
                    {d.present ? tr("Present") : d.cancelled ? tr("Present but cancelled") : tr("Not present")}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <VargaYogasCard chart={chart} />
    </div>
  );
}

/** The same yoga rules read in the Navamsa and Dasamsa — a Rasi yoga that holds there is firmer; one that appears only there is a lesser, subject-specific echo. */
function VargaYogasCard({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const rasi = new Set(chart.yogas.filter((y) => y.present).map((y) => y.key ?? y.name));
  const sections = ([["D9", "Navamsa (D9) — marriage, dharma, a planet's true strength"], ["D10", "Dasamsa (D10) — career and public life"]] as const)
    .map(([k, title]) => ({ k, title, yogas: chart.vargaYogas?.[k] ?? [] }))
    .filter((x) => x.yogas.length > 0);
  if (!sections.length) return null;
  return (
    <Card>
      <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Yogas in the divisional charts")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {tr("The Rasi chart decides whether a yoga exists. Here the same rules are read in the Navamsa and Dasamsa: a yoga that also forms there is firmer; one that forms only there is a lesser echo for that chart's subject.")}
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {sections.map(({ k, title, yogas }) => (
          <div key={k}>
            <p className="text-sm font-semibold text-cream">{tr(title)}</p>
            <ul className="mt-3 space-y-2">
              {yogas.map((y) => (
                <li key={y.key ?? y.name} className="text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-cream">{y.name}</span>{" — "}
                  <span className={rasi.has(y.key ?? y.name) ? "text-gold-bright" : ""}>{rasi.has(y.key ?? y.name) ? tr("also in the Rasi chart") : tr("only in this chart")}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HouseLordsTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {tr("Each house is ruled by the lord of the sign that falls in it. Where that lord actually sits in your chart connects the two houses — a core technique for reading a Vedic chart in depth.")}
      </p>
      <div className="mt-8 card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">{tr("House")}</th>
              <th className="px-4 py-3">{tr("Signifies")}</th>
              <th className="px-4 py-3">{tr("Sign")}</th>
              <th className="px-4 py-3">{tr("Lord")}</th>
              <th className="px-4 py-3">{tr("Lord Placed In")}</th>
            </tr>
          </thead>
          <tbody>
            {chart.houseLords.map((hl) => (
              <tr key={hl.house} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-cream">
                  <Link href={`/learn/houses#house-${hl.house}`} className="hover:text-gold-bright">
                    {hl.house}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{houseSignification(hl.house, locale)}</td>
                <td className="px-4 py-3 text-muted">{nm(hl.sign)}</td>
                <td className="px-4 py-3 text-cream">
                  <Link href={`/learn/planets#${hl.lord}`} className="hover:text-gold-bright">
                    {nm(hl.lord)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {tr("House")} {hl.lordHouse} ({nm(hl.lordSign)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
