"use client";

import { useRouter } from "next/navigation";
import { ACTIVITIES, type Activity } from "@/lib/astrology/muhurat";

export default function MuhuratControls({ activity, month }: { activity: Activity; month: string }) {
  const router = useRouter();
  const go = (a: string, m: string) => router.push(`/muhurat?activity=${a}&month=${m}`, { scroll: false });

  return (
    <div className="card-edge grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Occasion</span>
        <select value={activity} onChange={(e) => go(e.target.value, month)} className="input">
          {Object.entries(ACTIVITIES).map(([key, a]) => (
            <option key={key} value={key}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Month</span>
        <input type="month" value={month} onChange={(e) => e.target.value && go(activity, e.target.value)} className="input" />
      </label>
    </div>
  );
}
