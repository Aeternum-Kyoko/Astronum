/**
 * Fine-line icons for the tools, drawn on one 24px grid with a 1.5 stroke so
 * they sit together as a set. They inherit colour from the text.
 */
const PATHS: Record<string, React.ReactNode> = {
  // The North Indian chart: a square with its diagonals and inner diamond.
  kundli: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 3.5l17 17M20.5 3.5l-17 17M12 3.5 20.5 12 12 20.5 3.5 12Z" />
    </>
  ),
  // Two charts meeting.
  matching: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
  // A crescent with a small star.
  horoscope: (
    <>
      <path d="M15.5 4.2A8 8 0 1 0 19.8 15 6.5 6.5 0 0 1 15.5 4.2Z" />
      <path d="M18 3.5v3M16.5 5h3" />
    </>
  ),
  // A person under the Moon.
  personal: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
      <path d="M18.5 3.2a2.6 2.6 0 1 0 2.3 3.6 2 2 0 0 1-2.3-3.6Z" />
    </>
  ),
  // A day page with the Sun rising.
  panchang: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M8.5 17a3.5 3.5 0 0 1 7 0M6.5 17h11" />
    </>
  ),
  // A diya flame.
  festivals: (
    <>
      <path d="M4 15.5h16c-.8 2.8-4 4.5-8 4.5s-7.2-1.7-8-4.5Z" />
      <path d="M12 12.5c-1.6-1.2-2.2-2.7-1.5-4.3.5-1.2 1.5-2 1.5-4.2 1.4 1.3 3 3.2 2.6 5.4-.3 1.6-1.1 2.4-2.6 3.1Z" />
    </>
  ),
  // A calendar with an auspicious mark.
  muhurat: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  // Saturn and its ring.
  sadeSati: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M4.6 16.4c-1.4-1.4 1.3-4.8 6-7.5s9-3.4 9.9-1.7c.7 1.3-.9 3.3-3.7 5.3" />
    </>
  ),
  // A numeral in a square.
  numerology: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M10 8.5l2.5-1.5v10M10 17h5" />
    </>
  ),
  // A clock hand being adjusted.
  rectification: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.5 2M9.5 2.5h5M12 2.5v3" />
    </>
  ),
};

export default function ToolIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
