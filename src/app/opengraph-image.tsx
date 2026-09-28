import { ImageResponse } from "next/og";

export const alt = "Astronum — Vedic astrology, done right";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share image for every page that doesn't define its own.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(circle at 30% 40%, #1b2257 0%, #0a0e27 55%, #060815 100%)",
          color: "#f3ede0",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#e8c581", textTransform: "uppercase" }}>Astronum</div>
        <div style={{ marginTop: 28, fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Your birth chart.</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, color: "#e8c581" }}>Finally done right.</div>
        <div style={{ marginTop: 36, fontSize: 32, color: "#a6acd6" }}>
          Free Kundli · Kundli Matching · Panchang · Daily Horoscope
        </div>
      </div>
    ),
    size
  );
}
