/**
 * Per-device display preferences for the app feel: text size and how clear
 * the Liquid Glass chrome is (iOS 27's transparency slider). Stored in this
 * browser and applied by an inline script before paint, so nothing flickers.
 */

export const TEXT_SIZES = [
  { value: 0.92, label: "A−" },
  { value: 1, label: "A" },
  { value: 1.12, label: "A+" },
  { value: 1.25, label: "A++" },
] as const;

const KEY = "astronum-display";

export interface DisplayPrefs {
  /** Multiplies the root font size. */
  textScale: number;
  /** 0 = clearest glass, 100 = fully tinted. */
  glass: number;
  /** Let the glass highlight follow the phone's tilt. */
  tilt: boolean;
}

export const DEFAULT_PREFS: DisplayPrefs = { textScale: 1, glass: 45, tilt: false };

export function readPrefs(): DisplayPrefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyPrefs(p: DisplayPrefs) {
  const s = document.documentElement.style;
  s.setProperty("--text-scale", String(p.textScale));
  // Map 0–100 onto a tint of 0.35 (clear) to 0.97 (solid).
  s.setProperty("--glass-tint", String(0.35 + (p.glass / 100) * 0.62));
}

export function writePrefs(p: DisplayPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: applies for this visit only */
  }
  applyPrefs(p);
  window.dispatchEvent(new Event("display-prefs"));
}

/** Runs before first paint (see SiteHead). */
export const DISPLAY_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var s=document.documentElement.style;if(p.textScale)s.setProperty("--text-scale",p.textScale);if(typeof p.glass==="number")s.setProperty("--glass-tint",0.35+p.glass/100*0.62)}catch(e){}})();`;
