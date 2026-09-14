// Deterministic pseudo-random generator (mulberry32) so star positions are
// identical on server and client — avoids hydration mismatches that
// Math.random() at render time would cause.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const STARS = Array.from({ length: 90 }, () => ({
  x: rand() * 100,
  y: rand() * 100,
  size: 1 + rand() * 1.8,
  duration: 2.5 + rand() * 3.5,
  delay: rand() * 4,
  gold: rand() > 0.75,
}));

export default function Starfield({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star-twinkle absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: s.gold ? "var(--color-gold-bright)" : "var(--color-cream)",
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
