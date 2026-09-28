import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/PasswordResetForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
