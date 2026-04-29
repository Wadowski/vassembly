"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@vassembly/ui-login-form";
import { setTokens } from "../../lib/auth/sessionStorage";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleLoginSuccess = (result: { authToken: string; refreshToken: string }) => {
    setTokens({
      authToken: result.authToken,
      refreshToken: result.refreshToken,
    });
  };

  return (
    <LoginForm
      titleId="login-page-title"
      returnUrl={returnUrl}
      fallbackPath="/"
      onRedirect={(href) => router.replace(href)}
      onSuccess={handleLoginSuccess}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
