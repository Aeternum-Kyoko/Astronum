"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import { toBirthQuery } from "@/lib/birthParams";
import type { Dictionary } from "@/lib/i18n/dictionary";

/** Compact birth-details form; hands off to `target` (default /kundali) with the details in the URL. */
export default function QuickKundaliForm({ copy, target = "/kundali" }: { copy: Dictionary["home"]["form"]; target?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !time || !place) {
      setError(copy.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    router.push(
      `${target}?${toBirthQuery({
        name: name.trim(),
        date,
        time,
        place: place.displayName,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
      })}`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-edge shadow-floating rounded-3xl p-6 text-left md:p-7">
      <p className="font-display text-2xl text-cream">{copy.title}</p>
      <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>

      <div className="mt-5 space-y-4">
        <Field label={copy.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePlaceholder}
            className="input"
            autoComplete="name"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.date}>
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label={copy.time}>
            <TimePicker value={time} onChange={setTime} />
          </Field>
        </div>
        <Field label={copy.place}>
          <PlaceInput selected={place} onSelect={setPlace} showTimezone={false} placeholder={copy.placePlaceholder} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm text-rose">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-base font-semibold text-on-gold transition-colors hover:bg-gold-bright disabled:opacity-70"
      >
        {submitting ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
