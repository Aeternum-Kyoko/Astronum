import type { PlanetName } from "@/lib/astrology/constants";
import { siderealLongitude } from "@/lib/astrology/ephemeris";
import SkyDialInteractive from "./SkyDialInteractive";

const ORDER: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
export interface SkySnapshot {
  at: Date;
  positions: { planet: PlanetName; longitude: number }[];
}

export function skyNow(at = new Date()): SkySnapshot {
  return { at, positions: ORDER.map((planet) => ({ planet, longitude: siderealLongitude(planet, at) })) };
}


export default function SkyDial({ sky, className = "", locale = "en" }: { sky: SkySnapshot; className?: string; locale?: "en" | "hi" }) {
  return <SkyDialInteractive positions={sky.positions} at={sky.at.toISOString()} className={className} locale={locale} />;
}
