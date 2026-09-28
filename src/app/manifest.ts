import type { MetadataRoute } from "next";

/** Makes Astronum installable as an app on phones and desktops. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Astronum — Vedic Astrology",
    short_name: "Astronum",
    description: "Kundli, daily horoscope, Panchang and matching — every calculation explained.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1733",
    theme_color: "#0e1733",
    categories: ["lifestyle", "education"],
    lang: "en-IN",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today for you", short_name: "Today", url: "/today", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "My kundli", short_name: "Kundli", url: "/kundali", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Today's Panchang", short_name: "Panchang", url: "/panchang", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Daily horoscope", short_name: "Horoscope", url: "/horoscope", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
    ],
  };
}
