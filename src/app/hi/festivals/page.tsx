import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DateTime } from "luxon";

export default async function HindiFestivalsIndex() {
  await connection();
  redirect(`/hi/festivals/${DateTime.now().setZone("Asia/Kolkata").year}`);
}
