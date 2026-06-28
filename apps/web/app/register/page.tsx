"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@vassembly/ui-register-form";
import { ProtectedAuthRoute } from "../../lib/auth/ProtectedAuthRoute";
import { setTokens } from "../../lib/auth/sessionStorage";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleRegisterSuccess = (result: { authToken: string; refreshToken: string }) => {
    setTokens({
      authToken: result.authToken,
      refreshToken: result.refreshToken,
    });
    router.replace('/onboarding');
  };

  return (
    <RegisterForm
      titleId="register-page-title"
      returnUrl={returnUrl}
      fallbackPath="/onboarding"
      verificationPendingPath="/onboarding"
      onRedirect={() => {
        router.replace('/onboarding');
      }}
      onSuccess={handleRegisterSuccess}
    />
  );
}

export default function RegisterPage() {
  return (
    <ProtectedAuthRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterPageContent />
      </Suspense>
    </ProtectedAuthRoute>
  );
}
