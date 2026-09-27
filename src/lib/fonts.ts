import { Anek_Devanagari, Anek_Latin } from "next/font/google";

// Anek (Ek Type) — one variable family with matching Latin and Devanagari, and a width axis the design uses:
// condensed for headlines, normal for text, expanded for the wordmark.
export const anek = Anek_Latin({ variable: "--font-anek", subsets: ["latin"], axes: ["wdth"] });

// Loaded only by the Hindi layout, so English pages never download Devanagari.
export const anekDevanagari = Anek_Devanagari({ variable: "--font-anek-deva", subsets: ["devanagari"], axes: ["wdth"] });
