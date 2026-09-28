import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

/** A 1080×1350 share card for a kundli matching result. Values come from the query; nothing is stored. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const a = (q.get("a") ?? "Partner A").slice(0, 30);
  const b = (q.get("b") ?? "Partner B").slice(0, 30);
  const score = Math.max(0, Math.min(36, Number(q.get("score")) || 0));
  const verdict = (q.get("verdict") ?? "").slice(0, 40);
  const porutham = q.get("porutham");
  const good = score >= 18;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: 90, background: "radial-gradient(circle at 50% 30%, #1b2a5c 0%, #0e1733 70%)", color: "#eef0f5" }}>
        <div style={{ fontSize: 30, color: "#f2c14e", letterSpacing: 6 }}>ASTRONUM · KUNDLI MATCHING</div>
        <div style={{ marginTop: 90, fontSize: 64, fontWeight: 700, textAlign: "center" }}>{a}</div>
        <div style={{ fontSize: 44, color: "#a3aecb" }}>{"&"}</div>
        <div style={{ fontSize: 64, fontWeight: 700, textAlign: "center" }}>{b}</div>
        <div style={{ marginTop: 80, width: 380, height: 380, borderRadius: 190, border: `14px solid ${good ? "#e8a915" : "#ef7b76"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 140, fontWeight: 700 }}>{String(score)}</div>
          <div style={{ fontSize: 40, color: "#a3aecb" }}>of 36 gunas</div>
        </div>
        <div style={{ marginTop: 60, fontSize: 52, fontWeight: 700, color: good ? "#f2c14e" : "#ef7b76" }}>{verdict}</div>
        {porutham && <div style={{ marginTop: 20, fontSize: 36, color: "#a3aecb" }}>{`Dasa Porutham: ${porutham} of 10`}</div>}
        <div style={{ marginTop: "auto", fontSize: 30, color: "#a3aecb" }}>Ashtakoota and Porutham, with every koota explained</div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
