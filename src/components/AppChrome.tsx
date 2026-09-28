"use client";

import { useEffect, useSyncExternalStore } from "react";
import { haptic, hapticFor } from "@/lib/haptics";
import { readPrefs } from "@/lib/displayPrefs";

/**
 * App-level behaviour for phones: haptic ticks on selection-style taps,
 * the service worker (offline pages and fast repeat visits) and the
 * browser's install prompt, plus the Liquid Glass light and refraction.
 * Renders only the (invisible) refraction filter.
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
    // Refraction only where it renders (Chromium) and the device can afford it.
    const chromium = !!(navigator as { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands?.some((b) => b.brand === "Chromium");
    const capable = (navigator.hardwareConcurrency ?? 4) >= 6 && ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) >= 4;
    const reduced = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    document.documentElement.classList.toggle("glass-refract", chromium && capable && !reduced);

    // The glass highlight follows the finger, or the phone's tilt when the user has allowed it.
    let frame = 0;
    let lx = 50;
    let ly = -20;
    const commit = () => {
      frame = 0;
      document.documentElement.style.setProperty("--glass-lx", `${lx}%`);
      document.documentElement.style.setProperty("--glass-ly", `${ly}%`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(commit);
    };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onPointer = (e: PointerEvent) => {
      lx = Math.round((e.clientX / window.innerWidth) * 100);
      ly = -20 + Math.round((e.clientY / window.innerHeight) * 30);
      schedule();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (!readPrefs().tilt || e.gamma === null || e.beta === null) return;
      lx = Math.round(50 + Math.max(-45, Math.min(45, e.gamma)) * (50 / 45));
      ly = Math.round(-20 + Math.max(-30, Math.min(60, e.beta - 30)) * 0.5);
      schedule();
    };
    if (!still) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("deviceorientation", onTilt);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  // The refraction filter the glass bars point at (used only where html has .glass-refract).
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <filter id="liquid-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
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
