import type { LifeTimeline, LifeEvent, EventTheme } from "./lifeTimeline";

export interface CalendarSignal {
  key: string;
  date: Date;
  start: Date;
  end: Date;
  maha: string;
  antar: string;
  event: LifeEvent;
  agreeingLayers: string[];
  transitReason: string | null;
  counterpoint: string | null;
}

/** Sort already-calculated event windows by rule support; scores are not probabilities. */
export function calendarSignals(timeline: LifeTimeline, from: Date, months = 24, theme: EventTheme | "all" = "all"): CalendarSignal[] {
  const until = new Date(from);
  until.setUTCMonth(until.getUTCMonth() + months);
  const candidates = timeline.mahas.flatMap(maha => maha.antars.flatMap(antar => antar.events.map(event => {
    const start = new Date(antar.start);
    const end = new Date(antar.end);
    const peakStart = event.peak ? new Date(event.peak.start) : null;
    const peakEnd = event.peak ? new Date(event.peak.end) : null;
    const date = peakStart && peakEnd && peakEnd >= from ? new Date(Math.max(peakStart.getTime(), from.getTime())) : start > from ? start : from;
    const agreeingLayers = [...new Set(event.evidence.filter(item => item.points > 0).map(item => item.layer))];
    return {
      key: `${maha.lord}-${antar.lord}-${start.toISOString()}-${event.kind}`,
      date, start, end, maha: maha.lord, antar: antar.lord, event, agreeingLayers,
      transitReason: event.evidence.find(item => item.layer === "Transit" && item.points > 0)?.text ?? null,
      counterpoint: event.evidence.find(item => item.points < 0)?.text ?? null,
    };
  })));
  const related: Partial<Record<EventTheme, EventTheme[]>> = {
    career: ["career", "jobChange", "recognition"], marriage: ["marriage", "romance"],
    wealth: ["wealth", "loss"], property: ["property", "relocation"],
  };
  return candidates.filter(item => item.end >= from && item.date <= until && (theme === "all" || (related[theme] ?? [theme]).includes(item.event.kind)))
    .sort((left, right) => left.date.getTime() - right.date.getTime() || right.event.confidence - left.event.confidence || right.agreeingLayers.length - left.agreeingLayers.length);
}
