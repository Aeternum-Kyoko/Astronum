import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DateTime } from "luxon";
import { SIGNS, SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { computeDailyTransits, horoscopeForSign, resolveHoroscopeDay, signFromSlug } from "@/lib/astrology/horoscope";

const TZ = "Asia/Kolkata";

/** A 1080×1350 share card for one sign's daily horoscope. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const i = signFromSlug(q.get("sign") ?? "") ?? 0;
  const { date } = resolveHoroscopeDay(q.get("day") ?? undefined, TZ);
  const h = horoscopeForSign(i, computeDailyTransits(date, TZ), "en");
  const by = q.get("by") === "sun" ? "Sun sign" : "Moon sign";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 90, background: "radial-gradient(circle at 30% 25%, #1b2a5c 0%, #0e1733 70%)", color: "#eef0f5" }}>
        <div style={{ fontSize: 30, color: "#f2c14e", letterSpacing: 6 }}>ASTRONUM · DAILY RASHIFAL</div>
        <div style={{ marginTop: 70, fontSize: 110, fontWeight: 700 }}>{SIGNS[i]}</div>
        <div style={{ fontSize: 40, color: "#a3aecb" }}>{`${SIGN_SANSKRIT[i]} · by ${by} · ${DateTime.fromISO(date).toFormat("d LLLL yyyy")}`}</div>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center" }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14, background: k < h.rating ? "#f2c14e" : "#2a3a6b" }} />
          ))}
          <div style={{ marginLeft: 20, fontSize: 38, color: h.tone === "Challenging" ? "#ef7b76" : "#f2c14e" }}>{`${h.rating}/5 · ${h.tone}`}</div>
        </div>
        <div style={{ marginTop: 50, fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>{h.headline}</div>
        <div style={{ marginTop: 30, fontSize: 34, color: "#a3aecb", lineHeight: 1.4 }}>{h.reading.length > 260 ? `${h.reading.slice(0, 257)}…` : h.reading}</div>
        <div style={{ marginTop: "auto", fontSize: 30, color: "#a3aecb" }}>{`Focus today: ${h.focus}`}</div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
