import { z } from "zod";
import type { BirthInput } from "./astrology/types";
import type { PlanetName, VargaKey } from "./astrology/constants";
import { toBirthQuery } from "./birthParams";

export const precisionKey = (birth: BirthInput) => `astronum-precision:${toBirthQuery(birth)}`;
export const sensitivityKey = (birth: BirthInput) => `astronum-sensitivity:${toBirthQuery(birth)}`;
export const sensitivityRecordSchema = z.object({
  precision: z.enum(["0", "5", "15", "30"]),
  sampleCount: z.number().int().positive(),
  fields: z.array(z.object({ key: z.string(), stable: z.boolean() })),
});
export type SensitivityRecord = z.infer<typeof sensitivityRecordSchema>;

export function reliabilityState(precision: string, record: SensitivityRecord | null, varga: VargaKey, planet?: PlanetName) {
  if (precision === "unknown" || !["0", "5", "15", "30"].includes(precision)) return "unknown" as const;
  if (precision === "0") return "exact" as const;
  if (!record || record.precision !== precision) return "unchecked" as const;
  const keys = [`${varga} ascendant`, ...(planet ? [`${varga} ${planet} sign`] : [])];
  const fields = keys.map(key => record.fields.find(field => field.key === key));
  if (fields.some(field => field?.stable === false)) return "changes" as const;
  if (fields.every(field => field?.stable === true)) return "stable" as const;
  return "unchecked" as const;
}
