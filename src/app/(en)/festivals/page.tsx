import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DateTime } from "luxon";

export default async function FestivalsIndex() {
  await connection();
  redirect(`/festivals/${DateTime.now().setZone("Asia/Kolkata").year}`);
}
