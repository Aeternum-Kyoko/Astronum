import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";
import { toBirthQuery, type BirthParams } from "@/lib/birthParams";

/**
 * The last few kundlis opened on this device, kept in IndexedDB so they
 * still open with no connection. Browser-only; every call fails quietly
 * (private browsing, storage full) because this is a convenience.
 */

export interface StoredChart {
  key: string;
  input: BirthParams;
  chart: KundaliChart;
  report: KundaliReport;
  savedAt: number;
}

const DB = "astronum";
const STORE = "charts";
const KEEP = 5;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const chartKey = (input: BirthParams) => toBirthQuery(input);

export async function saveChart(input: BirthParams, chart: KundaliChart, report: KundaliReport): Promise<void> {
  try {
    await tx("readwrite", (s) => s.put({ key: chartKey(input), input, chart, report, savedAt: Date.now() } satisfies StoredChart));
    const all = await listCharts();
    for (const old of all.slice(KEEP)) await tx("readwrite", (s) => s.delete(old.key));
  } catch {
    /* storage unavailable: nothing to do */
  }
}

export async function loadChart(input: BirthParams): Promise<StoredChart | null> {
  try {
    return (await tx<StoredChart | undefined>("readonly", (s) => s.get(chartKey(input)))) ?? null;
  } catch {
    return null;
  }
}

/** Most recent first. */
export async function listCharts(): Promise<StoredChart[]> {
  try {
    const all = await tx<StoredChart[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}
