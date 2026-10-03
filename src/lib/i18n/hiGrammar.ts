/** Small Hindi grammar helpers for engine-written sentences. */

const ORDINAL_OBLIQUE = ["", "पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे", "सातवें", "आठवें", "नौवें", "दसवें", "ग्यारहवें", "बारहवें"];
const ORDINAL_DIRECT = ["", "पहला", "दूसरा", "तीसरा", "चौथा", "पाँचवाँ", "छठा", "सातवाँ", "आठवाँ", "नौवाँ", "दसवाँ", "ग्यारहवाँ", "बारहवाँ"];

/** "दसवें" — the ordinal as it appears before a postposition ("दसवें भाव में"). */
export const ordHi = (n: number) => ORDINAL_OBLIQUE[n] ?? `${n}वें`;
/** "दसवाँ" — the ordinal standing alone ("दसवाँ भाव"). */
export const ordHiDirect = (n: number) => ORDINAL_DIRECT[n] ?? `${n}वाँ`;

/** "क, ख और ग" */
export function listHi(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} और ${items[items.length - 1]}`;
}
