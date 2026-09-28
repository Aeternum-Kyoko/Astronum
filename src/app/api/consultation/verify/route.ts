import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { markOrderPaid } from "@/lib/consultationPayments";
import { razorpayConfig, verifyPaymentSignature } from "@/lib/razorpay";

const schema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const config = razorpayConfig();
  if (!config) return NextResponse.json({ error: "Payments are not enabled." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  if (!verifyPaymentSignature(orderId, paymentId, signature, config.keySecret)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  if (!(await markOrderPaid(orderId, paymentId))) {
    return NextResponse.json({ error: "Booking not found for this payment." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
