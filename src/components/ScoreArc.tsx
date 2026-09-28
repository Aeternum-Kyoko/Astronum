/**
 * A day's score as an open arc (like a fuel gauge), with the number inside.
 * Gold from 55 up, cream in the middle, rose below 35. Renders on the server.
 */
export default function ScoreArc({ score, size = 132, label = "out of 100" }: { score: number; size?: number; label?: string }) {
  const r = 52;
  const sweep = 270; // degrees of arc drawn; the gap sits at the bottom
  const len = (2 * Math.PI * r * sweep) / 360;
  const value = Math.max(0, Math.min(100, score));
  const color = value >= 55 ? "var(--color-gold)" : value >= 35 ? "var(--color-cream)" : "var(--color-rose)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${value} ${label || "out of 100"}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full rotate-[135deg]" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${len} 999`} opacity="0.6" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(value / 100) * len} 999`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-tabular leading-none font-bold text-cream" style={{ fontSize: size * 0.3 }}>
          {value}
        </span>
        {label && <span className="mt-1 text-xs text-muted">{label}</span>}
      </div>
    </div>
  );
}
