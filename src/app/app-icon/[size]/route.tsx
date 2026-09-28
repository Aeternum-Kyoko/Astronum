import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

/**
 * App icons for the web app manifest, drawn from the Astronum moon mark.
 * `?maskable=1` gives the full-bleed version Android crops into a circle or
 * squircle, with the mark kept inside the safe zone.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/app-icon/[size]">) {
  const { size: raw } = await ctx.params;
  const size = [192, 512].includes(Number(raw)) ? Number(raw) : 192;
  const maskable = req.nextUrl.searchParams.get("maskable") === "1";
  const mark = maskable ? size * 0.56 : size * 0.8;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: maskable ? "#0e1733" : "transparent" }}>
        <svg width={mark} height={mark} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="16" fill="#0e1733" />
          <circle cx="16" cy="16" r="13.5" stroke="#e8a915" strokeWidth="1.2" fill="none" />
          <path d="M21 7A11 11 0 1 0 21 25 8.9 8.9 0 0 1 21 7Z" fill="#e8a915" />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=31536000, immutable" } }
  );
}
