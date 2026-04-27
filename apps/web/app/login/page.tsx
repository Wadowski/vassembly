"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@vassembly/ui-login-form";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  return (
    <LoginForm
      titleId="login-page-title"
      returnUrl={returnUrl}
      fallbackPath="/"
      onRedirect={(href) => router.replace(href)}
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
