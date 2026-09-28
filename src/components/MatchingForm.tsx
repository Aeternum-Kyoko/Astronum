"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import ProfileChips from "@/components/ProfileChips";
import CopyLinkButton from "@/components/CopyLinkButton";
import MatchingResult from "@/components/MatchingResult";
import CompatibilityReport from "@/components/CompatibilityReport";
import SegmentedControl from "@/components/SegmentedControl";
import { fromBirthQuery, toBirthQuery, type BirthParams } from "@/lib/birthParams";
import type { CompatibilityResponse, MatchResponse } from "@/lib/astrology/matching";

export type MatchKind = "marriage" | "romance" | "business" | "friendship";
const KINDS: MatchKind[] = ["marriage", "romance", "business", "friendship"];
const KIND_LABEL: Record<MatchKind, string> = { marriage: "Marriage", romance: "Romance", business: "Business", friendship: "Friendship" };
const KIND_NOTE: Record<MatchKind, string> = {
  marriage: "The classical 36-point Ashtakoota Guna Milan with a Mangal Dosha check.",
  romance: "Attraction, emotional rhythm, intimacy and romance overlays.",
  business: "Trust, working style, Mercury, wealth overlays and current timing.",
  friendship: "Mental rapport, temperament and the house of friends.",
};

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface PersonDraft {
  name: string;
  date: string;
  time: string;
  place: PlaceSuggestion | null;
}

const EMPTY: PersonDraft = { name: "", date: "", time: "", place: null };

function draftFrom(params: BirthParams | null): PersonDraft {
  if (!params) return EMPTY;
  return {
    name: params.name,
    date: params.date,
    time: params.time,
    place: { displayName: params.place, latitude: params.latitude, longitude: params.longitude, timezone: params.timezone },
  };
}

function toParams(d: PersonDraft): BirthParams | null {
  if (!d.name.trim() || !d.date || !d.time || !d.place) return null;
  return {
    name: d.name.trim(),
    date: d.date,
    time: d.time,
    place: d.place.displayName,
    latitude: d.place.latitude,
    longitude: d.place.longitude,
    timezone: d.place.timezone,
  };
}

export default function MatchingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Shared links carry both people: b* keys for the boy, g* keys for the girl.
  const [urlPair] = useState(() => {
    const q = new URLSearchParams(searchParams.toString());
    const boy = fromBirthQuery(q, "b");
    const girl = fromBirthQuery(q, "g");
    return boy && girl ? { boy, girl } : null;
  });
  const [boy, setBoy] = useState<PersonDraft>(() => draftFrom(urlPair?.boy ?? null));
  const [girl, setGirl] = useState<PersonDraft>(() => draftFrom(urlPair?.girl ?? null));
  const [kind, setKind] = useState<MatchKind>(() => {
    const t = searchParams.get("type");
    return KINDS.includes(t as MatchKind) ? (t as MatchKind) : "marriage";
  });
  const [loading, setLoading] = useState(Boolean(urlPair));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResponse | CompatibilityResponse | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoRan = useRef(false);

  async function runMatch(b: BirthParams, g: BirthParams) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boy: b, girl: g, type: kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
      router.replace(`/matching?${toBirthQuery(b, "b")}&${toBirthQuery(g, "g")}${kind === "marriage" ? "" : `&type=${kind}`}`, { scroll: false });
      requestAnimationFrame(() => anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRan.current || !urlPair) return;
    autoRan.current = true;
    void runMatch(urlPair.boy, urlPair.girl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the URL present on arrival
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const b = toParams(boy);
    const g = toParams(girl);
    if (!b || !g) {
      setError("Fill in all details for both people, picking each birth place from the list.");
      return;
    }
    void runMatch(b, g);
  }

  function reset() {
    setResult(null);
    router.replace(kind === "marriage" ? "/matching" : `/matching?type=${kind}`, { scroll: false });
  }

  return (
    <div ref={anchorRef} className="scroll-mt-24">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            <div className="mb-6 flex flex-wrap justify-end gap-2">
              <CopyLinkButton />
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
              >
                Match another pair
              </button>
            </div>
            {"match" in result ? <MatchingResult result={result} /> : <CompatibilityReport result={result} />}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <SegmentedControl
                layoutId="match-kind"
                value={kind}
                onChange={(k) => {
                  setKind(k);
                  setError(null);
                }}
                options={KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
              />
              <p className="text-sm text-muted">{KIND_NOTE[kind]}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <PersonFields title={kind === "marriage" ? "Boy's details" : "First person"} value={boy} onChange={setBoy} />
              <PersonFields title={kind === "marriage" ? "Girl's details" : "Second person"} value={girl} onChange={setGirl} />
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
                {error}
              </p>
            )}

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gold px-9 py-4 text-base font-semibold text-on-gold transition-colors hover:bg-gold-bright disabled:opacity-70 md:w-auto"
              >
                {loading ? "Matching charts…" : kind === "marriage" ? "Match kundlis" : `Check ${KIND_LABEL[kind].toLowerCase()} compatibility`}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PersonDraft;
  onChange: (d: PersonDraft) => void;
}) {
  return (
    <fieldset className="card-edge rounded-3xl p-6 md:p-7">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="font-display text-xl text-cream">
        {title}
      </p>
      <div className="mt-4">
        <ProfileChips label="Fill from a saved profile" onPick={(p) => onChange(draftFrom(p))} />
      </div>
      <div className="mt-5 space-y-4">
        <Field label="Name">
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Full name"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <DatePicker value={value.date} onChange={(date) => onChange({ ...value, date })} />
          </Field>
          <Field label="Time of birth">
            <TimePicker value={value.time} onChange={(time) => onChange({ ...value, time })} />
          </Field>
        </div>
        <Field label="Place of birth">
          <PlaceInput selected={value.place} onSelect={(place) => onChange({ ...value, place })} showTimezone={false} />
        </Field>
      </div>
    </fieldset>
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
