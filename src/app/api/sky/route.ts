import { skyNow } from "@/lib/skySnapshot";

export async function GET() {
  return Response.json(skyNow(), { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
}
