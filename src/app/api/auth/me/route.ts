import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  return NextResponse.json({ user: await getCurrentUser() }, { headers: { "Cache-Control": "no-store" } });
}
