export default function MoonMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="12" stroke="var(--color-gold)" strokeWidth="1" />
      <path d="M17 5.5A9 9 0 1 0 17 20.5 7.3 7.3 0 0 1 17 5.5Z" fill="var(--color-gold)" />
    </svg>
  );
}
