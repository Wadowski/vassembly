"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@vassembly/ui-register-form";
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
  };

  return (
    <RegisterForm
      titleId="register-page-title"
      returnUrl={returnUrl}
      fallbackPath="/"
      verificationPendingPath="/register/pending"
      onRedirect={(href) => {
        router.replace(href);
      }}
      onSuccess={handleRegisterSuccess}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
