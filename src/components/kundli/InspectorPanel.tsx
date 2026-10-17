"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";

const subscribe = (notify: () => void) => {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const snapshot = () => window.matchMedia("(max-width: 767px)").matches;

/** Native dialog supplies focus containment, Escape, and an inert background. */
export default function InspectorPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const mobile = useSyncExternalStore(subscribe, snapshot, () => false);
  const dialog = useRef<HTMLDialogElement>(null);
  const L = pick(useLocale());
  useEffect(() => {
    if (!mobile || !open) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [mobile, open]);
  if (!mobile) return <div className="workspace-inspector">{children}</div>;
  return <dialog ref={dialog} className="planet-sheet" aria-label={L("Planet and house details", "ग्रह और भाव विवरण")} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="planet-sheet-content"><div className="sheet-grabber" aria-hidden="true" /><header className="planet-sheet-header"><h2>{L("Chart details", "कुंडली विवरण")}</h2><button type="button" onClick={onClose}>{L("Done", "पूर्ण")}</button></header><div className="planet-sheet-body">{children}</div></div>
  </dialog>;
}
