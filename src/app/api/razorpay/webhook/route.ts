import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/consultationPayments";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook (configure for the payment.captured event). A backstop for
 * when the customer closes the tab before the checkout callback reaches us.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 404 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
  };
  const payment = event.payload?.payment?.entity;
  if (event.event === "payment.captured" && payment?.id && payment.order_id) {
    await markOrderPaid(payment.order_id, payment.id);
  }
  return NextResponse.json({ ok: true });
}
