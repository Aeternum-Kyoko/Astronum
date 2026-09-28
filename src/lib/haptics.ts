/**
 * Haptic feedback for the phone app experience.
 *
 * Android (and other browsers with the Vibration API) get short vibration
 * patterns. iOS Safari has no Vibration API, but since Safari 17.4 toggling
 * a native switch control plays the system haptic tick — so on iOS we click
 * a hidden `<input type="checkbox" switch>`. Both only work inside a user
 * gesture, which is where haptics belong anyway. Users can switch haptics
 * off; the choice is kept in this browser.
 */

export type HapticKind = "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 18,
  heavy: 28,
  success: [10, 50, 16],
  warning: [18, 70, 18],
  error: [24, 50, 24, 50, 24],
};

// iOS taps per kind — a sequence of ticks approximates the stronger patterns.
const IOS_TICKS: Record<HapticKind, number[]> = {
  selection: [0],
  light: [0],
  medium: [0],
  heavy: [0, 40],
  success: [0, 90],
  warning: [0, 120],
  error: [0, 80, 160],
};

const KEY = "astronum-haptics";
let iosSwitch: HTMLLabelElement | null = null;

export function hapticsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode: the setting just won't persist */
  }
}

/** Touch devices only — a mouse click shouldn't buzz a laptop. */
function coarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function iosTick() {
  if (!iosSwitch) {
    iosSwitch = document.createElement("label");
    iosSwitch.setAttribute("aria-hidden", "true");
    iosSwitch.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    iosSwitch.appendChild(input);
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click();
}

export function haptic(kind: HapticKind = "light") {
  if (typeof window === "undefined" || !coarsePointer() || !hapticsEnabled()) return;
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(PATTERNS[kind]);
    return;
  }
  for (const delay of IOS_TICKS[kind]) {
    if (delay === 0) iosTick();
    else setTimeout(iosTick, delay);
  }
}

/**
 * Which haptic a tapped element should give, if any. Selection-style
 * controls tick; submits give a firmer tap; ordinary links stay silent.
 * An explicit `data-haptic="…"` wins, and `data-haptic="none"` silences.
 */
export function hapticFor(target: Element): HapticKind | null {
  const explicit = target.closest<HTMLElement>("[data-haptic]");
  if (explicit) {
    const v = explicit.dataset.haptic as HapticKind | "none";
    return v === "none" ? null : v || "selection";
  }
  if (target.closest("button[type=submit]")) return "medium";
  if (target.closest("[aria-pressed], button[aria-current], [role=tab], [role=switch], [role=radio], input[type=checkbox], input[type=radio], [role=button], summary, select")) return "selection";
  if (target.closest("nav[aria-label=Quick] a")) return "selection";
  return null;
}
