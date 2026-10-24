"use client";
import { useEffect, useState } from "react";
const cache = new Map<string, { data: unknown; at: number }>();
/** Per-input response cache. Requests are cancelled when their input or active state changes. */
export function useCalculation<T>(url: string, body: unknown, active = true) {
  const key = JSON.stringify([url, body]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let live = true;
    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const hit = cache.get(key);
        let data: unknown;
        if (hit && Date.now() - hit.at < 900000) data = hit.data;
        else {
          const [endpoint, payload] = JSON.parse(key);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          data = await response.json();
          if (!response.ok)
            throw new Error(
              (data as { error?: string }).error ??
                "This calculation could not load.",
            );
          cache.set(key, { data, at: Date.now() });
          if (cache.size > 24) cache.delete(cache.keys().next().value!);
        }
        if (live) setState({ data: data as T, loading: false, error: null });
      } catch (error) {
        if (live)
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load this calculation.",
          });
      }
    }
    void run();
    return () => {
      live = false;
      controller.abort();
    };
  }, [key, active, revision]);
  return {
    ...state,
    retry: () => {
      cache.delete(key);
      setRevision((v) => v + 1);
    },
  };
}
