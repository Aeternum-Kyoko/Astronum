"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
const fallback = new Map<string, string>();
const CHANGE = "astronum-device-store";
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => { if (event.key) fallback.delete(event.key); else fallback.clear(); callback(); };
  window.addEventListener("storage", storage); window.addEventListener(CHANGE, callback);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(CHANGE, callback); };
}
/** Stable string snapshots avoid hydration mismatches and repeated object snapshots. */
export function useDeviceStore<T>(key: string, initial: T): [T, (value: T) => boolean] {
  const initialJson = JSON.stringify(initial);
  const read = useCallback(() => { try { return fallback.get(key) ?? localStorage.getItem(key) ?? initialJson; } catch { return fallback.get(key) ?? initialJson; } }, [key, initialJson]);
  const raw = useSyncExternalStore(subscribe, read, () => initialJson);
  const value = useMemo(() => { try { return JSON.parse(raw) as T; } catch { return JSON.parse(initialJson) as T; } }, [raw, initialJson]);
  const set = useCallback((next: T) => {
    const json = JSON.stringify(next); let saved = true;
    try { localStorage.setItem(key, json); fallback.delete(key); } catch { saved = false; fallback.set(key, json); }
    window.dispatchEvent(new Event(CHANGE)); return saved;
  }, [key]);
  return [value, set];
}
