"use client";
import { useEffect, useRef, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import type { HeavySection, KundaliReport } from "@/lib/astrology/report";
import type { TopicKey } from "@/lib/astrology/topicReading";
import { SIGN_SANSKRIT, type VargaKey } from "@/lib/astrology/constants";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { KUNDLI_SECTIONS } from "@/lib/kundliLibrary";
import SegmentedControl from "./SegmentedControl";
import PrintReport from "./PrintReport";
import { AnalysisProvider, useAnalysis } from "./kundli/AnalysisContext";
import AnalysisCalendar from "./kundli/AnalysisCalendar";
import ObservatoryOverview, {
  ObservatoryHeader,
  ObservatoryCharts,
  TimingLanding,
  PositionLedger,
} from "./kundli/Observatory";
import ObservatoryNavigation from "./kundli/ObservatoryNavigation";
import { SectionLearningGuide } from "./kundli/SectionLearningGuide";
import {
  TopicChapter,
  ReadingAtlas,
  PlacementReader,
} from "./kundli/ObservatoryReadings";
import { SectionContents, SectionNextSteps } from "./kundli/SectionGuide";
import "./kundli/workspace.css";
import "./kundli/cinema.css";
import "./kundli/rebuilt.css";
import "./kundli/research.css";
function ToolLoading() {
  return (
    <div className="research-empty" role="status">
      Loading this investigation…
    </div>
  );
}
const TransitWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.TransitWorkspace),
  { loading: ToolLoading },
);
const MonthlyWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.MonthlyWorkspace),
  { loading: ToolLoading },
);
const AnnualWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.AnnualWorkspace),
  { loading: ToolLoading },
);
const TimelineWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.TimelineWorkspace),
  { loading: ToolLoading },
);
const SignalCalendarWorkspace = dynamic(
  () =>
    import("./kundli/TimingWorkspaces").then((m) => m.SignalCalendarWorkspace),
  { loading: ToolLoading },
);
const YoginiWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.YoginiWorkspace),
  { loading: ToolLoading },
);
const CharaWorkspace = dynamic(
  () => import("./kundli/TimingWorkspaces").then((m) => m.CharaWorkspace),
  { loading: ToolLoading },
);
const ShadbalaWorkspace = dynamic(
  () => import("./kundli/StrengthWorkspaces").then((m) => m.ShadbalaWorkspace),
  { loading: ToolLoading },
);
const AshtakavargaWorkspace = dynamic(
  () =>
    import("./kundli/StrengthWorkspaces").then((m) => m.AshtakavargaWorkspace),
  { loading: ToolLoading },
);
const HouseRulersWorkspace = dynamic(
  () =>
    import("./kundli/StrengthWorkspaces").then((m) => m.HouseRulersWorkspace),
  { loading: ToolLoading },
);
const YogaWorkspace = dynamic(
  () => import("./kundli/StrengthWorkspaces").then((m) => m.YogaWorkspace),
  { loading: ToolLoading },
);
const KpWorkspace = dynamic(
  () => import("./kundli/SystemWorkspaces").then((m) => m.KpWorkspace),
  { loading: ToolLoading },
);
const LalKitabWorkspace = dynamic(
  () => import("./kundli/SystemWorkspaces").then((m) => m.LalKitabWorkspace),
  { loading: ToolLoading },
);
const ReferenceWorkspace = dynamic(
  () => import("./kundli/SystemWorkspaces").then((m) => m.ReferenceWorkspace),
  { loading: ToolLoading },
);
const SectorWorkspace = dynamic(
  () => import("./kundli/SystemWorkspaces").then((m) => m.SectorWorkspace),
  { loading: ToolLoading },
);
const RemedyWorkspace = dynamic(
  () => import("./kundli/GuidanceWorkspaces").then((m) => m.RemedyWorkspace),
  { loading: ToolLoading },
);
const RudrakshaWorkspace = dynamic(
  () => import("./kundli/GuidanceWorkspaces").then((m) => m.RudrakshaWorkspace),
  { loading: ToolLoading },
);
const VastuWorkspace = dynamic(
  () => import("./kundli/GuidanceWorkspaces").then((m) => m.VastuWorkspace),
  { loading: ToolLoading },
);
const PrecisionWorkspace = dynamic(
  () => import("./kundli/CaseWorkspaces").then((m) => m.PrecisionWorkspace),
  { loading: ToolLoading },
);
const CalculationWorkspace = dynamic(
  () => import("./kundli/CaseWorkspaces").then((m) => m.CalculationWorkspace),
  { loading: ToolLoading },
);
const JournalWorkspace = dynamic(
  () => import("./kundli/CaseWorkspaces").then((m) => m.JournalWorkspace),
  { loading: ToolLoading },
);
const ComparisonWorkspace = dynamic(
  () => import("./kundli/CaseWorkspaces").then((m) => m.ComparisonWorkspace),
  { loading: ToolLoading },
);

type Tab =
  | "Summary"
  | "Astrologer Workspace"
  | "Signal Calendar"
  | "Dashboard"
  | "Overview"
  | "Birth Precision"
  | "Event Journal"
  | "Calculation Details"
  | "Relationships"
  | "Wealth"
  | "Education"
  | "Property"
  | "Career"
  | "Life Report"
  | "Life Sectors"
  | "Houses"
  | "Planet Readings"
  | "Annual Reading"
  | "Transits"
  | "Monthly Forecast"
  | "Life Timeline"
  | "Dashas"
  | "Yogini Dasha"
  | "Chara Dasha"
  | "Compare Charts"
  | "D1 · Rasi Chart"
  | "D9 · Navamsa"
  | "More Vargas"
  | "Ashtakavarga"
  | "Shadbala"
  | "House Lords"
  | "Yogas & Doshas"
  | "KP System"
  | "Lal Kitab"
  | "Special Tables"
  | "Remedies"
  | "Rudraksha"
  | "Vastu & Home";

const USER_TABS = new Set<string>([
  "Summary",
  ...KUNDLI_SECTIONS.filter((item) => item.personal).map((item) => item.tab),
]);

/** The heavy report sections each tab needs. */
const TAB_SECTIONS: Partial<Record<Tab, HeavySection[]>> = {
  "Life Timeline": ["timeline"],
  "Signal Calendar": ["timeline"],
  "Life Sectors": ["sectors"],
  "Yogini Dasha": ["yogini"],
  "Chara Dasha": ["chara"],
};

/** URL-friendly names for deep links such as /kundali?tab=dashas. */
export const TAB_SLUGS: Record<string, Tab> = {
  summary: "Summary",
  workbench: "Astrologer Workspace",
  precision: "Birth Precision",
  journal: "Event Journal",
  calculations: "Calculation Details",
  compare: "Compare Charts",
  relationships: "Relationships",
  wealth: "Wealth",
  education: "Education",
  property: "Property",
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

type WorkbenchProps = {
  chart: KundaliChart;
  report: KundaliReport | null;
  go: (slug: string) => void;
  mode: "user" | "astrologer";
  active: boolean;
};
const WORKBENCHES: Partial<Record<Tab, ComponentType<WorkbenchProps>>> = {
  Transits: (props) => <TransitWorkspace {...props} />,
  "Monthly Forecast": (props) => <MonthlyWorkspace {...props} />,
  "Annual Reading": (props) => <AnnualWorkspace {...props} />,
  "Life Timeline": (props) => <TimelineWorkspace {...props} />,
  "Signal Calendar": (props) => <SignalCalendarWorkspace {...props} />,
  "Yogini Dasha": (props) => <YoginiWorkspace {...props} />,
  "Chara Dasha": (props) => <CharaWorkspace {...props} />,
  Shadbala: (props) => <ShadbalaWorkspace {...props} />,
  Ashtakavarga: (props) => <AshtakavargaWorkspace {...props} />,
  "House Lords": (props) => <HouseRulersWorkspace {...props} />,
  "Yogas & Doshas": (props) => <YogaWorkspace {...props} />,
  "KP System": (props) => <KpWorkspace {...props} />,
  "Lal Kitab": (props) => <LalKitabWorkspace {...props} />,
  "Special Tables": (props) => <ReferenceWorkspace {...props} />,
  "Life Sectors": (props) => <SectorWorkspace {...props} />,
  Remedies: (props) => <RemedyWorkspace {...props} />,
  Rudraksha: (props) => <RudrakshaWorkspace {...props} />,
  "Vastu & Home": (props) => <VastuWorkspace {...props} />,
  "Birth Precision": (props) => <PrecisionWorkspace {...props} />,
  "Calculation Details": (props) => <CalculationWorkspace {...props} />,
  "Event Journal": (props) => <JournalWorkspace {...props} />,
  "Compare Charts": (props) => <ComparisonWorkspace {...props} />,
};
const TOPIC_TABS: Partial<Record<Tab, TopicKey>> = {
  Career: "career",
  Relationships: "relationships",
  Wealth: "wealth",
  Education: "education",
  Property: "property",
};
function SectionContent(props: WorkbenchProps & { section: Tab }) {
  const { section, chart, report, go, mode } = props;
  const Tool = WORKBENCHES[section];
  if (Tool) return <Tool {...props} />;
  if (section === "Summary")
    return <ObservatoryOverview chart={chart} go={go} mode={mode} />;
  if (section === "Dashas")
    return <TimingLanding chart={chart} report={report} go={go} mode={mode} />;
  if (["D1 · Rasi Chart", "D9 · Navamsa", "More Vargas"].includes(section))
    return <PositionLedger chart={chart} />;
  if (section === "Life Report")
    return <ReadingAtlas chart={chart} mode={mode} go={go} />;
  if (section === "Planet Readings" || section === "Houses")
    return (
      <PlacementReader
        chart={chart}
        mode={mode}
        go={go}
        kind={section === "Houses" ? "houses" : "planets"}
      />
    );
  const topic = TOPIC_TABS[section];
  if (topic)
    return <TopicChapter chart={chart} mode={mode} go={go} topic={topic} />;
  return null;
}

export default function KundaliResult(props: {
  chart: KundaliChart;
  report: KundaliReport | null;
  initialTab?: string | null;
  loadSections?: (sections: HeavySection[]) => void;
}) {
  return (
    <AnalysisProvider chart={props.chart}>
      <KundaliWorkspace {...props} />
    </AnalysisProvider>
  );
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
  const locale = useLocale();
  const [savedMode, saveMode] = useDeviceStore<string>(
    "astronum-kundli-mode",
    "user",
  );
  const mode = savedMode === "astrologer" ? "astrologer" : "user";
  const analysis = useAnalysis()!;
  const cleanTab = (value: Tab): Tab =>
    ["Astrologer Workspace", "Dashboard", "Overview"].includes(value)
      ? "Summary"
      : value;
  const initial = cleanTab((initialTab && TAB_SLUGS[initialTab]) || "Summary");
  const [chosenTab, setTabState] = useState<Tab>(initial);
  const tab = chosenTab;
  const syncedTab = useRef<Tab | null>(null);
  useEffect(() => {
    if (syncedTab.current === tab) return;
    syncedTab.current = tab;
    if (tab === "D1 · Rasi Chart")
      analysis.update({
        primary: "D1",
        secondary: "D9",
        overlay: false,
        compare: true,
      });
    if (tab === "D9 · Navamsa")
      analysis.update({
        primary: "D9",
        secondary: "D1",
        overlay: false,
        compare: true,
      });
    if (tab === "More Vargas")
      analysis.update({
        primary: ["D1", "D9"].includes(analysis.primary)
          ? "D10"
          : analysis.primary,
        secondary: "D1",
        overlay: false,
        compare: true,
      });
    if (
      tab === "Transits" &&
      (analysis.primary !== "D1" || analysis.overlay || analysis.compare)
    )
      analysis.update({
        primary: "D1",
        reference: "lagna",
        overlay: false,
        compare: false,
        filter: "all",
      });
  }, [tab, analysis]);
  const [visited, setVisited] = useState<Tab[]>([initial]);
  const setTab = (value: Tab, history = true, useToday = false) => {
    const t = cleanTab(value);
    setVisited((current) => (current.includes(t) ? current : [...current, t]));
    setTabState(t);
    window.requestAnimationFrame(() =>
      (t === "Summary"
        ? document.querySelector(".obs-profile-bar")
        : [
              "D1 · Rasi Chart",
              "D9 · Navamsa",
              "More Vargas",
              "Transits",
            ].includes(t)
          ? document.querySelector(".rebuilt-chart-stage")
          : t === "Compare Charts"
            ? document.querySelector(".rebuilt-reading")
            : document.getElementById("kundli-sections")
      )?.scrollIntoView({
        block: "start",
        behavior: "instant",
      }),
    );
    if (t === "D1 · Rasi Chart")
      analysis.update({
        primary: "D1",
        secondary: "D9",
        overlay: false,
        compare: true,
      });
    if (t === "More Vargas")
      analysis.update({
        primary: ["D1", "D9"].includes(analysis.primary)
          ? "D10"
          : analysis.primary,
        secondary: "D1",
        overlay: false,
        compare: true,
      });
    if (t === "D9 · Navamsa")
      analysis.update({
        primary: "D9",
        secondary: "D1",
        overlay: false,
        compare: true,
      });
    if (t === "Transits") {
      const now = DateTime.now().setZone(analysis.zone);
      analysis.update({
        primary: "D1",
        reference: "lagna",
        overlay: false,
        compare: false,
        ...(useToday
          ? { date: now.toISODate()!, time: now.toFormat("HH:mm:ss") }
          : {}),
        filter: "all",
      });
    }
    const topicVarga: Partial<Record<Tab, VargaKey>> = {
      Career: "D10",
      Relationships: "D9",
      Wealth: "D2",
      Education: "D24",
      Property: "D4",
    };
    if (topicVarga[t])
      analysis.update({
        primary: "D1",
        secondary: topicVarga[t],
        compare: mode === "astrologer",
        overlay: false,
      });
    if (t === "Compare Charts") analysis.update({ compare: true });
    const slug = Object.keys(TAB_SLUGS).find((k) => TAB_SLUGS[k] === t);
    if (history && slug) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", slug);
      window.history.pushState(null, "", url);
    }
  };
  useEffect(() => {
    const restore = () => {
      const slug = new URL(window.location.href).searchParams.get("tab");
      const t = cleanTab((slug && TAB_SLUGS[slug]) || "Summary");
      setTabState(t);
      setVisited((current) =>
        current.includes(t) ? current : [...current, t],
      );
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  // Load only the report data required by the chosen section; visited panels retain their local state.
  useEffect(() => {
    const need = TAB_SECTIONS[tab];
    if (need?.length && report) loadSections?.(need);
  }, [tab, report, loadSections]);

  const go = (slug: string) => {
    if (TAB_SLUGS[slug]) setTab(TAB_SLUGS[slug]);
  };
  const currentSection = KUNDLI_SECTIONS.find((item) => item.tab === tab);
  const changeMode = (value: string) => {
    if (value === mode) return;
    if (value === "user" && !USER_TABS.has(tab)) setTab("Summary");
    saveMode(value);
  };
  return (
    <div
      className={`kundli-rebuilt mode-${mode}`}
      data-mode={mode}
      data-active-tab={tab}
    >
      <div className="print:hidden">
        <header className="rebuilt-topbar">
          <ObservatoryHeader chart={chart} go={go} />
          <SegmentedControl
            layoutId="reading-mode"
            ariaLabel={pick(locale)(
              "Choose Personal or Astrologer mode",
              "व्यक्तिगत या ज्योतिषी दृश्य चुनें",
            )}
            value={mode}
            options={[
              { value: "user", label: pick(locale)("Personal", "व्यक्तिगत") },
              {
                value: "astrologer",
                label: pick(locale)("Astrologer", "ज्योतिषी"),
              },
            ]}
            onChange={changeMode}
          />
        </header>
        <ObservatoryNavigation mode={mode} go={go} tab={tab} />
        {![
          "Summary",
          "Dashas",
          "D1 · Rasi Chart",
          "D9 · Navamsa",
          "More Vargas",
          "Transits",
        ].includes(tab) && <AnalysisCalendar compact />}
        {tab !== "Summary" && (
          <header className="rebuilt-section-intro">
            <button type="button" onClick={() => go("summary")}>
              {pick(locale)("‹ Back to overview", "‹ अवलोकन पर लौटें")}
            </button>
            <h2>
              {currentSection
                ? locale === "hi"
                  ? currentSection.titleHi
                  : currentSection.title
                : tab}
            </h2>
            {currentSection && (
              <p>
                {locale === "hi"
                  ? currentSection.descriptionHi
                  : currentSection.description}
              </p>
            )}
            {!currentSection?.personal && mode === "user" && (
              <span className="rebuilt-specialist-note">
                {pick(locale)(
                  "Specialist section · switch to Astrologer for the complete investigation library",
                  "विशेषज्ञ अनुभाग · पूरी विश्लेषण लाइब्रेरी के लिए ज्योतिषी दृश्य चुनें",
                )}
              </span>
            )}
          </header>
        )}
        {tab !== "Summary" && <SectionLearningGuide tab={tab} />}
        <div className="rebuilt-content">
          {tab !== "Summary" && <SectionContents tab={tab} />}
          {[
            "D1 · Rasi Chart",
            "D9 · Navamsa",
            "More Vargas",
            "Transits",
          ].includes(tab) && (
            <section className="rebuilt-chart-stage">
              <ObservatoryCharts
                chart={chart}
                mode={mode}
                go={go}
                overview={tab === "Transits"}
              />
            </section>
          )}
          <main
            className="rebuilt-reading"
            aria-label={pick(locale)(
              "Reading and analysis",
              "व्याख्या और विश्लेषण",
            )}
          >
            {visited.map((panelTab) => (
              <div
                className="reading-section"
                data-reading={panelTab}
                key={panelTab}
                hidden={panelTab !== tab}
              >
                <SectionContent
                  section={panelTab}
                  chart={chart}
                  report={report}
                  go={go}
                  mode={mode}
                  active={panelTab === tab}
                />
              </div>
            ))}
          </main>
          {tab !== "Summary" && (
            <SectionNextSteps tab={tab} mode={mode} go={go} />
          )}
        </div>

        {locale === "hi" ? (
          <p className="mt-16 text-center text-xs text-muted">
            राशियाँ निरयण (सायन नहीं) राशिचक्र से दिखाई गई हैं। यह फल शास्त्रीय
            नियमों से बना है और एक आरंभ-बिंदु है, अंतिम निर्णय नहीं। आपके लिए
            विशेष व्याख्या हेतु{" "}
            <a
              href="/consultation"
              className="text-gold-bright hover:text-gold"
            >
              व्यक्तिगत परामर्श बुक करें
            </a>
            ।
          </p>
        ) : (
          <p className="mt-16 text-center text-xs text-muted">
            Signs shown use the sidereal (Nirayana) zodiac —{" "}
            {SIGN_SANSKRIT[chart.ascendant.signIndex]} is the Sanskrit name for{" "}
            {chart.ascendant.sign}. This reading is generated from classical
            rules and is meant as a starting point, not a final word.{" "}
            <a
              href="/consultation"
              className="text-gold-bright hover:text-gold"
            >
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
