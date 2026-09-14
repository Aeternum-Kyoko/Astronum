const GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export default function ZodiacWheel({ className = "" }: { className?: string }) {
  const center = 200;
  const outerR = 190;
  const innerR = 140;
  const glyphR = 165;
  const tickR = 178;

  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x1 = center + innerR * Math.cos(angle);
    const y1 = center + innerR * Math.sin(angle);
    const x2 = center + outerR * Math.cos(angle);
    const y2 = center + outerR * Math.sin(angle);
    return { x1, y1, x2, y2 };
  });

  // A fine tick every 6° around the outer rim, for the feel of a calibrated instrument.
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6 - 90) * (Math.PI / 180);
    const major = i % 5 === 0;
    const r1 = tickR;
    const r2 = major ? tickR + 8 : tickR + 4;
    return {
      x1: center + r1 * Math.cos(angle),
      y1: center + r1 * Math.sin(angle),
      x2: center + r2 * Math.cos(angle),
      y2: center + r2 * Math.sin(angle),
      opacity: major ? 0.4 : 0.18,
    };
  });

  const glyphPositions = GLYPHS.map((g, i) => {
    const angle = (i * 30 - 75) * (Math.PI / 180);
    const x = center + glyphR * Math.cos(angle);
    const y = center + glyphR * Math.sin(angle);
    return { g, x, y };
  });

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <filter id="zw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--color-gold)" strokeWidth="1" opacity={t.opacity} />
      ))}

      <circle cx={center} cy={center} r={outerR} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.5" />
      <circle cx={center} cy={center} r={innerR} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.35" />
      <circle cx={center} cy={center} r="60" fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.25" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--color-gold)" strokeWidth="1" opacity="0.3" />
      ))}
      {glyphPositions.map(({ g, x, y }, i) => (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fill="var(--color-gold-bright)"
          opacity="0.85"
          filter="url(#zw-glow)"
        >
          {g}
        </text>
      ))}
      <circle cx={center} cy={center} r="3" fill="var(--color-gold-bright)" filter="url(#zw-glow)" />
    </svg>
  );
}
