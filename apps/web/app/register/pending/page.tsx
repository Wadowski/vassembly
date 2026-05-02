import { Text } from "@vassembly/ui-text";
import { Button } from "@vassembly/ui-button";

export default function RegisterPendingPage() {
  return (
    <main>
      <section
        aria-labelledby="register-pending-title"
        role="region"
      >
        <Text as="h1" id="register-pending-title" variant="h1">
          Verify your email
        </Text>
        <Text>
          Check your email to verify your account. If you do not see the message within a few
          minutes, look in your spam or promotions folder.
        </Text>
        <Button as="a" variant="text" href="/login" text="Back to login" />
      </section>
    </main>
  );
}
