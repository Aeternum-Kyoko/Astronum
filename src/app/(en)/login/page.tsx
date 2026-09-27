import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
        {/* AuthForm reads ?next= to return people to where they were. */}
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </section>
  );
}
