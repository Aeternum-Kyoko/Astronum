"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import PlaceInput, { type PlaceSuggestion } from "@/components/PlaceInput";
import { panchangHref, type PanchangLocation } from "@/lib/panchangUrl";

/** Date and city pickers; the page itself is rendered on the server from the resulting URL. */
export default function PanchangControls({
  date,
  location,
  basePath = "/panchang",
  labels = { date: "Date", city: "City" },
}: {
  date: string;
  location: PanchangLocation;
  basePath?: string;
  labels?: { date: string; city: string };
}) {
  const router = useRouter();
  const [place, setPlace] = useState<PlaceSuggestion | null>({
    displayName: location.place,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  });

  function go(nextDate: string, nextPlace: PlaceSuggestion) {
    router.push(
      panchangHref(nextDate, {
        place: nextPlace.displayName,
        latitude: nextPlace.latitude,
        longitude: nextPlace.longitude,
        timezone: nextPlace.timezone,
      }, basePath),
      { scroll: false }
    );
  }

  return (
    <div className="card-edge grid gap-4 rounded-2xl p-5 md:grid-cols-[220px_1fr]">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">{labels.date}</span>
        <DatePicker value={date} onChange={(d) => place && go(d, place)} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">{labels.city}</span>
        <PlaceInput
          selected={place}
          onSelect={(p) => {
            setPlace(p);
            if (p) go(date, p);
          }}
          showTimezone={false}
        />
      </label>
    </div>
  );
}
