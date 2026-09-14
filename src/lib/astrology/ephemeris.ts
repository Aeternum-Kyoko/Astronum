import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./ayanamsa";

const TROPICAL_BODIES = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
} as const;

/** Tropical geocentric ecliptic longitude (true equinox of date), in degrees. */
function tropicalLongitude(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return normalizeDegrees(ecl.elon);
}

/**
 * Mean lunar ascending node longitude (Meeus, Astronomical Algorithms ch. 47),
 * tropical, degrees. Used as Rahu; Ketu is always exactly opposite.
 */
function meanLunarNodeLongitude(date: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const T = (date.getTime() - J2000) / 86400000 / 36525;
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  return normalizeDegrees(omega);
}

export interface RawPositions {
  tropicalLongitudes: Record<string, number>;
  trueObliquity: number;
  greenwichSiderealHours: number;
}

function obliquityAndSiderealTime(date: Date): { trueObliquity: number; greenwichSiderealHours: number } {
  const tilt = Astronomy.e_tilt(Astronomy.MakeTime(date));
  const gst = Astronomy.SiderealTime(date);
  return { trueObliquity: tilt.tobl, greenwichSiderealHours: gst };
}

export function computeRawPositions(date: Date): RawPositions {
  const tropicalLongitudes: Record<string, number> = {};
  for (const [name, body] of Object.entries(TROPICAL_BODIES)) {
    tropicalLongitudes[name] = tropicalLongitude(body, date);
  }
  const rahu = meanLunarNodeLongitude(date);
  tropicalLongitudes.Rahu = rahu;
  tropicalLongitudes.Ketu = normalizeDegrees(rahu + 180);

  return { tropicalLongitudes, ...obliquityAndSiderealTime(date) };
}

/** Is the body moving backward in ecliptic longitude at this moment? */
export function isRetrograde(bodyName: keyof typeof TROPICAL_BODIES, date: Date): boolean {
  const body = TROPICAL_BODIES[bodyName];
  const dayMs = 86400000;
  const before = tropicalLongitude(body, new Date(date.getTime() - dayMs));
  const after = tropicalLongitude(body, new Date(date.getTime() + dayMs));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/** Signed daily motion in degrees/day (negative when retrograde), via a symmetric 1-day finite difference. */
export function dailyMotion(bodyName: keyof typeof TROPICAL_BODIES, date: Date): number {
  const body = TROPICAL_BODIES[bodyName];
  const dayMs = 86400000;
  const before = tropicalLongitude(body, new Date(date.getTime() - dayMs));
  const after = tropicalLongitude(body, new Date(date.getTime() + dayMs));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta / 2;
}

/** True (not house-based) day/night determination — is the Sun above the horizon at this moment and place? Used for Kaala Bala's Nathonnata component. */
export function isDaytimeBirth(date: Date, latitude: number, longitude: number): boolean {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const equator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
  const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, "normal");
  return horizon.altitude > 0;
}

/**
 * Tropical ecliptic longitude of the Ascendant (Lagna) and Midheaven, in degrees.
 * Standard spherical-astronomy formulas from the local sidereal time, geographic
 * latitude, and true obliquity of the ecliptic.
 */
export function computeAscendantAndMidheaven(
  date: Date,
  latitude: number,
  longitude: number
): { ascendant: number; midheaven: number } {
  const { trueObliquity, greenwichSiderealHours } = obliquityAndSiderealTime(date);

  const lstHours = normalizeDegrees((greenwichSiderealHours + longitude / 15) * 15) / 15;
  const ramc = lstHours * 15; // right ascension of the meridian, in degrees

  const rad = Math.PI / 180;
  const eps = trueObliquity * rad;
  const phi = latitude * rad;
  const ramcRad = ramc * rad;

  const ascY = Math.cos(ramcRad);
  const ascX = -(Math.sin(ramcRad) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  const ascendant = normalizeDegrees(Math.atan2(ascY, ascX) / rad);

  const mcY = Math.sin(ramcRad);
  const mcX = Math.cos(ramcRad) * Math.cos(eps);
  const midheaven = normalizeDegrees(Math.atan2(mcY, mcX) / rad);

  return { ascendant, midheaven };
}
