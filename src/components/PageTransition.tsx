"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Animates route changes like an app: tabs crossfade, going deeper slides
 * in from the right, going back slides in from the left. Keyed by path so
 * each page enters and exits; links opt in with `transitionTypes`.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const types = { tab: "tab-fade", "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };
  return (
    <ViewTransition key={pathname} enter={types} exit={types} default="none">
      {children}
    </ViewTransition>
  );
}
