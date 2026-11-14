import { DateTime } from "luxon";

/** Reject normalized calendar dates and DST gaps/overlaps instead of guessing a birth instant. */
export function inspectBirthMoment(date: string, time: string, timezone: string) {
  const local = `${date}T${time.length === 5 ? `${time}:00` : time}`;
  const moment = DateTime.fromISO(local, { zone: timezone });
  if (!moment.isValid) return { valid: false as const, error: "Enter a valid date, time and timezone.", utc: null };
  if (moment.toFormat("yyyy-MM-dd'T'HH:mm:ss") !== local) return { valid: false as const, error: "This local time does not exist because of a clock change. Check the recorded birth time.", utc: null };
  const options = moment.getPossibleOffsets();
  if (options.length > 1) return { valid: false as const, error: `This birth time occurs twice during a clock change. Confirm the recorded UTC offset (${options.map(p => p.toFormat("ZZ")).join(" or ")}) and enter a fixed zone such as UTC${options[0].toFormat("ZZ")}.`, utc: null };
  return { valid: true as const, error: null, utc: moment.toUTC().toISO()!, offset: moment.toFormat("ZZ"), dst: moment.isInDST };
}
