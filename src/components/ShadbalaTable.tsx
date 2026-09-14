import type { ShadbalaResult } from "@/lib/astrology/types";

function fmt(n: number): string {
  return n.toFixed(1);
}

export default function ShadbalaTable({ shadbala }: { shadbala: ShadbalaResult[] }) {
  return (
    <div>
      <div className="card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Sthana</th>
              <th className="px-4 py-3">Dig</th>
              <th className="px-4 py-3">Kaala</th>
              <th className="px-4 py-3">Chesta</th>
              <th className="px-4 py-3">Naisargika</th>
              <th className="px-4 py-3">Drik</th>
              <th className="px-4 py-3">Total (Rupas)</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {shadbala.map((s) => (
              <tr key={s.planet} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-cream">{s.planet}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.sthanaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.digBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.kaalaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.chestaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.naisargikaBala)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.drikBala)}</td>
                <td className="px-4 py-3 font-semibold text-cream">{fmt(s.rupas)}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.requiredRupas)}</td>
                <td className="px-4 py-3">
                  <span className={s.isStrong ? "text-gold-bright" : "text-rose"}>
                    {s.isStrong ? "Strong" : "Weak"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Shadbala here is a documented approximation, not full classical precision: Sthana, Dig, Naisargika, and
        Drik Bala are computed in full; Kaala Bala includes only its Nathonnata and Paksha components (Tribhaga
        and the Varsha/Masa/Dina/Hora-lord balas are omitted); Chesta Bala is approximated from retrograde state
        and speed. Totals in Rupas (virupas ÷ 60) are compared against each planet&rsquo;s classical minimum
        requirement to flag Strong/Weak — treat this as a relative strength signal, not a definitive classical
        reading.
      </p>
    </div>
  );
}
