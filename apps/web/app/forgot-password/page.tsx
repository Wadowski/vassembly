"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@vassembly/ui-forgot-password";
import { ProtectedAuthRoute } from "../../lib/auth/ProtectedAuthRoute";

function ForgotPasswordPageContent() {
  const router = useRouter();

  return (
    <ForgotPasswordForm
      title="Reset Password"
      titleId="forgot-password-page-title"
      onSuccess={() => router.replace("/")}
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <ProtectedAuthRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <ForgotPasswordPageContent />
      </Suspense>
    </ProtectedAuthRoute>
  );
}
