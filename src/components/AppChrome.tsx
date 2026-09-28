"use client";

import { useEffect, useSyncExternalStore } from "react";
import { haptic, hapticFor } from "@/lib/haptics";

/**
 * App-level behaviour for phones: haptic ticks on selection-style taps,
 * the service worker (offline pages and fast repeat visits) and the
 * browser's install prompt. Renders nothing.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export default function AppChrome() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const kind = e.target instanceof Element ? hapticFor(e.target) : null;
      if (kind) haptic(kind);
    };
    document.addEventListener("click", onClick, { capture: true });

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallPromptEvent;
      notify();
    };
    const onInstalled = () => {
      deferred = null;
      notify();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Only in production: a service worker in development would serve stale builds.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

type InstallState = "installed" | "prompt" | "ios" | "unavailable";

function installState(): InstallState {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) return "installed";
  if (deferred) return "prompt";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios";
  return "unavailable";
}

/** Whether the app can be installed, and how. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    installState,
    () => "unavailable"
  );
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  if (outcome === "accepted") haptic("success");
  return outcome === "accepted";
}
