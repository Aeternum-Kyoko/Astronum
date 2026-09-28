import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { findPlan } from "@/lib/consultationPlans";
import { notifyConsultation } from "@/lib/consultationNotify";
import { createRazorpayOrder, razorpayConfig } from "@/lib/razorpay";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  birthPlace: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  message: z.string().trim().max(2000).optional(),
  planId: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const razorpay = razorpayConfig();
  const plan = razorpay ? findPlan(data.planId) : null;
  if (razorpay && !plan) {
    return NextResponse.json({ error: "Please choose a consultation plan." }, { status: 400 });
  }

  const booking = await prisma.consultationRequest.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      birthDate: new Date(`${data.birthDate}T00:00:00Z`),
      birthTime: data.birthTime,
      birthPlace: data.birthPlace,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      message: data.message,
      planId: plan?.id,
      amountPaise: plan?.pricePaise,
      paymentStatus: plan ? "unpaid" : "not_required",
    },
  });

  if (!plan || !razorpay) {
    await notifyConsultation(booking);
    return NextResponse.json({ ok: true });
  }

  try {
    // The amount always comes from the server-side plan, never from the client.
    const order = await createRazorpayOrder(plan.pricePaise, booking.id, { booking: booking.id, plan: plan.id });
    await prisma.consultationRequest.update({ where: { id: booking.id }, data: { razorpayOrderId: order.id } });
    return NextResponse.json({
      payment: {
        keyId: razorpay.keyId,
        orderId: order.id,
        amount: plan.pricePaise,
        description: `${plan.name} · ${plan.minutes} min`,
        prefill: { name: data.name, email: data.email, contact: data.phone ?? "" },
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
  }
}
