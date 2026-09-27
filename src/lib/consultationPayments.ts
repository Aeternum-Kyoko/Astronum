import { prisma } from "@/lib/db";
import { notifyConsultation } from "@/lib/consultationNotify";

/**
 * Marks the booking for a Razorpay order as paid. Idempotent — the browser
 * callback and the webhook can both arrive, in either order — and only the
 * first transition to "paid" sends the confirmation emails.
 */
export async function markOrderPaid(orderId: string, paymentId: string): Promise<boolean> {
  const { count } = await prisma.consultationRequest.updateMany({
    where: { razorpayOrderId: orderId, paymentStatus: { not: "paid" } },
    data: { paymentStatus: "paid", razorpayPaymentId: paymentId, paidAt: new Date() },
  });
  if (count > 0) {
    const booking = await prisma.consultationRequest.findUnique({ where: { razorpayOrderId: orderId } });
    if (booking) await notifyConsultation(booking);
  }
  return (await prisma.consultationRequest.count({ where: { razorpayOrderId: orderId, paymentStatus: "paid" } })) > 0;
}
