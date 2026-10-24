"use client";

import { useEffect, useRef, useState } from "react";
import { KUNDLI_SECTIONS } from "@/lib/kundliLibrary";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** Index actual rendered headings, including reports that arrive asynchronously. */
export function SectionContents({ tab }: { tab:string }) {
  const hi = useLocale() === "hi";
  const host = useRef<HTMLElement>(null);
  const targets = useRef<HTMLElement[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);
  useEffect(() => {
    const reading = host.current?.parentElement?.querySelector(".rebuilt-reading");
    if (!reading) return;
    const scan = () => {
      const panel = reading.querySelector<HTMLElement>(".reading-section:not([hidden])");
      targets.current = [...(panel?.querySelectorAll<HTMLElement>("h2,h3") ?? [])].filter(node => !node.closest("details:not([open])") && !node.closest("[hidden]"));
      for (const node of targets.current) node.dataset.sectionHeading = "true";
      const next = targets.current.map(node => node.textContent?.trim() ?? "").filter(Boolean);
      setHeadings(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const observer = new MutationObserver(scan);
    observer.observe(reading,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","open"]});
    queueMicrotask(scan);
    return () => observer.disconnect();
  },[tab]);
  return <nav ref={host} className="rebuilt-section-index" aria-label={hi ? "इस पृष्ठ में" : "On this page"} hidden={headings.length < 2}><strong>{hi ? "इस पृष्ठ में" : "On this page"}</strong><div>{headings.map((heading,index) => <button type="button" key={`${index}:${heading}`} onClick={() => { const target = targets.current[index]; if(target) { target.tabIndex = -1; target.focus({preventScroll:true}); target.scrollIntoView({block:"start",behavior:"instant"}); } }}>{heading}</button>)}</div></nav>;
}

export function SectionNextSteps({ tab, mode, go }: { tab:string; mode:"user"|"astrologer"; go:(slug:string)=>void }) {
  const hi = useLocale() === "hi";
  const current = KUNDLI_SECTIONS.find(section => section.tab === tab);
  if(!current) return null;
  const related = KUNDLI_SECTIONS.filter(section => section.tab !== tab && (mode === "user" ? current.personal && section.personal === current.personal : section.expert === current.expert));
  return <nav className="rebuilt-section-footer" aria-label={hi ? "संबंधित अनुभाग" : "Related sections"}><p className="text-muted">{hi ? "संबंधित अनुभाग देखें" : "Continue exploring related sections"}</p><div>{related.map(section => <button key={section.slug} type="button" onClick={() => go(section.slug)}>{hi ? section.titleHi : section.title}</button>)}<button type="button" onClick={() => go("summary")}>{hi ? "अवलोकन" : "Back to overview"}</button></div></nav>;
}
