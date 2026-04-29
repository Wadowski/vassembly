"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@vassembly/ui-register-form";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  return (
    <RegisterForm
      titleId="register-page-title"
      returnUrl={returnUrl}
      fallbackPath="/"
      verificationPendingPath="/register/pending"
      onRedirect={(href) => {
        router.replace(href);
      }}
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
