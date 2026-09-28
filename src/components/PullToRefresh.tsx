"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";

const TRIGGER = 72;

/**
 * Pull down from the top to refresh, like a native app. Only in the
 * installed app — in a browser the browser's own pull-to-refresh applies.
 */
export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, startRefresh] = useTransition();
  const start = useRef<number | null>(null);
  const armed = useRef(false);

  const standalone = () => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

  function onTouchStart(e: React.TouchEvent) {
    start.current = window.scrollY <= 0 && standalone() ? e.touches[0].clientY : null;
    armed.current = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (start.current === null) return;
    const dy = e.touches[0].clientY - start.current;
    if (dy <= 0) return setPull(0);
    const d = Math.min(120, dy * 0.5); // resistance, like rubber
    setPull(d);
    if (d >= TRIGGER && !armed.current) {
      armed.current = true;
      haptic("medium");
    } else if (d < TRIGGER) armed.current = false;
  }
  function onTouchEnd() {
    if (start.current === null) return;
    start.current = null;
    if (armed.current) {
      startRefresh(() => router.refresh());
      haptic("success");
    }
    setPull(0);
  }

  const shown = refreshing ? TRIGGER * 0.6 : pull;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div aria-hidden={!refreshing} className="flex justify-center overflow-hidden transition-[height] duration-200" style={{ height: shown }}>
        <span
          className={`mt-3 h-7 w-7 rounded-full border-2 border-gold border-t-transparent ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)`, opacity: Math.min(1, shown / TRIGGER) }}
        />
        {refreshing && <span className="sr-only">Refreshing…</span>}
      </div>
      {children}
    </div>
  );
}
