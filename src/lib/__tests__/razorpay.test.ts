import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "../razorpay";
import { CONSULTATION_PLANS, findPlan, formatInr } from "../consultationPlans";

describe("Razorpay signatures", () => {
  const secret = "test_secret";

  it("accepts a genuine checkout signature and rejects tampered ones", () => {
    const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "other_secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "short", secret)).toBe(false);
  });

  it("verifies webhooks against the exact raw body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, sig, secret)).toBe(false);
  });
});

describe("consultation plans", () => {
  it("finds plans by id and formats rupees", () => {
    expect(findPlan(CONSULTATION_PLANS[0].id)).toBe(CONSULTATION_PLANS[0]);
    expect(findPlan("nope")).toBeNull();
    expect(formatInr(150000)).toBe("₹1,500");
  });
});
