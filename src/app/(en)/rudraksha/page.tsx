import type { Metadata } from "next";
import Link from "next/link";
import ToolShell, { birthFromParams } from "@/components/views/ToolShell";
import RudrakshaPanel from "@/components/RudrakshaPanel";
import { calculateKundali } from "@/lib/astrology/kundali";
import { toBirthQuery } from "@/lib/birthParams";

export const metadata: Metadata = {
  title: "Rudraksha by Kundli — Which Mukhi Suits You and Why",
  description:
    "Find the rudraksha beads your birth chart needs — your lifelong Lagna bead, the beads for your running dasha, and remedies for weak planets, Sade Sati and doshas — with every reason, mantra and how to wear them.",
  alternates: { canonical: "/rudraksha" },
};

export default async function RudrakshaPage({ searchParams }: PageProps<"/rudraksha">) {
  const birth = birthFromParams(await searchParams);
  const chart = birth ? calculateKundali(birth) : null;
  return (
    <ToolShell
      eyebrow="Rudraksha by kundli"
      title="Which rudraksha suits you, and why"
      intro="Every rudraksha is ruled by a graha. Enter your birth details to see the beads your chart needs — for life, for your current dasha and as remedies — with every reason shown."
      path="/rudraksha"
      submit="Find my rudraksha"
      birth={birth}
    >
      {chart && birth && (
        <>
          <RudrakshaPanel chart={JSON.parse(JSON.stringify(chart))} />
          <p className="mt-8 text-center text-sm text-muted">
            See the full reasoning in your{" "}
            <Link href={`/kundali?${toBirthQuery(birth)}&tab=rudraksha`} className="font-semibold text-gold-bright hover:text-gold">
              kundli
            </Link>
            .
          </p>
        </>
      )}
    </ToolShell>
  );
}
