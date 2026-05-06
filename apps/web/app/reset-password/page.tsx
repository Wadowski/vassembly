"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@vassembly/ui-reset-password-form";
import { ProtectedAuthRoute } from "../../lib/auth/ProtectedAuthRoute";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token === null || token === "") {
      router.replace("/forgot-password?reason=no-token");
    }
  }, [router, token]);

  if (token === null || token === "") {
    return null;
  }

  return (
    <ResetPasswordForm
      token={token}
      titleId="reset-password-page-title"
      onSuccess={() => router.push("/login")}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <ProtectedAuthRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordPageContent />
      </Suspense>
    </ProtectedAuthRoute>
  );
}
