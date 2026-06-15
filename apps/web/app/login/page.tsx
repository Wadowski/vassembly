"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@vassembly/ui-login-form";
import { ProtectedAuthRoute } from "../../lib/auth/ProtectedAuthRoute";
import { setTokens } from "../../lib/auth/sessionStorage";

function LoginPageContent({ returnUrl }: { returnUrl: string | null }) {
  const router = useRouter();

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

function LoginPageWrapper() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  return (
    <ProtectedAuthRoute redirectPath={returnUrl ?? "/"}>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPageContent returnUrl={returnUrl} />
      </Suspense>
    </ProtectedAuthRoute>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageWrapper />
    </Suspense>
  );
}
