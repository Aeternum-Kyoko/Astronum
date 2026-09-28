import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone and iPad. iOS adds its own rounded corners, so this is full-bleed. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e1733" }}>
        <svg width="120" height="120" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13.5" stroke="#e8a915" strokeWidth="1.2" fill="none" />
          <path d="M21 7A11 11 0 1 0 21 25 8.9 8.9 0 0 1 21 7Z" fill="#e8a915" />
        </svg>
      </div>
    ),
    size
  );
}
