# @vassembly/ui-register-form

## Package overview

`@vassembly/ui-register-form` is the UI-layer package for user registration in Vassembly. It renders a complete registration form, validates input client-side, calls the `/user/register` API via `@vassembly/ui-api-hooks`, updates auth context on success, and coordinates post-registration messaging and redirect.

**Key features**

- Client-side validation with clear, snackbar-based feedback
- Password strength indicator with five requirement checks and Weak / Fair / Good / Strong levels
- Optional email-verification flow (`requiresEmailVerification`) with distinct success messaging
- Accessible markup: labels, live region for strength, busy submit control
- Optional safe `returnUrl` handling (same-origin only; invalid values fall back to `fallbackPath`)

**When to use**

Use this package on register/sign-up screens in apps that already use workspace UI, snackbar, and user-auth providers. It is designed to align with **`@vassembly/ui-login-form`** (shared props such as `returnUrl`, `fallbackPath`, `onRedirect`, `onSuccess`).

## Installation and setup

This package is a **workspace internal** dependency. You do not install it from npm; add it to your app package with `workspace:*` (or consume it from another workspace package that already depends on it), then run `pnpm install` from the monorepo root.

**Import**

```tsx
import { RegisterForm, useRegisterForm } from '@vassembly/ui-register-form';
import type { RegisterFormProps, RegisterFormSubmitResult, RegisterNavigateFn } from '@vassembly/ui-register-form';
```

Transitive dependencies (for example `@vassembly/ui-api-hooks`, `@vassembly/ui-system-design/snackbar`, `@vassembly/ui-user-auth`) are resolved when you install the workspace; your app shell should still mount providers those hooks expect (notably the snackbar provider).

## Usage

### Basic example

```tsx
import { RegisterForm } from '@vassembly/ui-register-form';

export function RegisterPage() {
  return (
    <RegisterForm
      titleId="register-page-title"
      fallbackPath="/"
      onRedirect={(href) => router.replace(href)}
    />
  );
}
```

### With `onSuccess` callback

```tsx
<RegisterForm
  onSuccess={(result) => {
    // result includes authToken, refreshToken, user, requiresEmailVerification
    void persistTokens(result.authToken, result.refreshToken);
  }}
/>
```

### `returnUrl` (optional)

Same pattern as `@vassembly/ui-login-form`: if `returnUrl` is a non-empty, same-origin URL, navigation after success uses it; otherwise `fallbackPath` (default `/`) is used. Invalid or cross-origin values safely fall back to `fallbackPath`.

```tsx
<RegisterForm returnUrl={searchParams.get('returnUrl')} fallbackPath="/dashboard" onRedirect={(href) => router.replace(href)} />
```

## Component props (`RegisterFormProps`)

| Prop | Type | Description |
|------|------|-------------|
| `titleId?` | `string` | If set, renders the “Create Account” heading with this `id` and wires `aria-describedby` on the email field for accessibility. |
| `className?` | `string` | Optional class merged onto the root `<section>`. |
| `submitLabel?` | `string` | Submit button label (default: **Create account**). |
| `returnUrl?` | `string \| null` | Optional post-registration target; only applied when valid and same-origin. |
| `fallbackPath?` | `string` | Redirect when `returnUrl` is missing or invalid (default: **`/`**). |
| `onRedirect?` | `RegisterNavigateFn` | `(href: string) => void` — SPA navigation after success. If omitted, `window.location.href` is used. |
| `onSuccess?` | `(result: RegisterFormSubmitResult) => void` | Called after a successful registration, session update, and before redirect/snackbar timing in the completion effect. |

## Success result type (`RegisterFormSubmitResult`)

```typescript
{
  authToken: string;
  refreshToken: string;
  user: AuthUser; // from @vassembly/ui-user-auth — typically { id, email? } after mapping from API user
  requiresEmailVerification?: boolean;
}
```

- **`user`**: Stored in session via `useUserAuth`’s `setSession` (mapped to `AuthUser`: at minimum `id`, with `email` when present). Profile fields from the API may exist on the registration response but are not all mirrored into `AuthUser` by this package’s mapper.
- **`authToken` / `refreshToken`**: Returned for consumers who persist tokens (for example secure storage or a custom session layer); they are not part of `setSession`’s parameters in the built-in user-auth types.
- **`requiresEmailVerification`**: When true, an informational snackbar asks the user to verify email; when false, a short success snackbar is shown.

## Form fields and validation

**Fields**

- **Email** — required; valid email format; trimmed before submit.
- **First name** — required; trimmed (additional rules may apply server-side).
- **Last name** — required; trimmed (additional rules may apply server-side).
- **Password** — required; minimum 8 characters; must reach **strong** client-side (all four character classes: upper, lower, number, special).
- **Confirm password** — required; must match password.

**Behavior**

- Password field shows real-time strength and requirement checklist.
- Submit runs full schema validation; the first failing rule message is shown in an **error** snackbar.
- Values are trimmed in the submit handler before the API call.

**Client validation messages (representative)**

- Email empty → `Email is required.`
- Email invalid → `Enter a valid email address.`
- Password empty → `Password is required.`
- Password short → `Password must be at least 8 characters.`
- Password not strong enough → `Password strength is too low. Use uppercase, lowercase, a number, and a special character.`
- Confirm empty → `Please confirm your password.`
- Mismatch → `Passwords must match.`
- Names → `First name is required.` / `Last name is required.`

## Password strength indicator

- **Visual**: Overall label **Weak / Fair / Good / Strong** plus five rows (✓/✗) for: minimum length, uppercase, lowercase, number, special character (labels match `PASSWORD_REQUIREMENT_LABELS` in code).
- **Submission rule**: Client-side submit requires **strong** (all five checks satisfied), not merely “good”.
- **Accessibility**: Container uses `role="status"`, `aria-live="polite"`, and `aria-label="Password strength"`.

## Error handling

**Validation** — Messages above are shown via `useSnackbar` (`variant: 'error'`).

**API / network** — `formatRegisterErrorMessage` maps `@vassembly/errors` shapes and HTTP hints to user-facing strings, including:

- Email already registered → `This email is already registered.`
- Password policy / weak password wording from server → `Password doesn't meet requirements.`
- Bad request / validation class → `Please check your information and try again.`
- Timeout → `Request timed out. Please try again.`
- Network / status `0` / message containing “network” → `Network error. Please try again.`
- Fallback → `Registration failed. Please try again.`

**Display** — Errors are transient snackbars; the user stays on the form with fields preserved.

## Post-registration flow

1. User submits; client validation runs, then `useRegister` POSTs to **`/user/register`**.
2. **Success**: Response user is mapped to `AuthUser`, `setSession({ user, status: 'authenticated' })` runs, then `onSuccess` runs with tokens and flags.
3. **Snackbar**: If `requiresEmailVerification` → info: `Please verify your email to confirm your account.` Else success: `Account created successfully.`
4. **Navigation**: `resolvePostRegisterTargetUrl` chooses `returnUrl` (if safe) or `fallbackPath`; `onRedirect(href)` or full page navigation.
5. **Failure**: Error snackbar; user can correct and resubmit.

## Integration with navigation and login

Pair with your app router (`onRedirect` + `fallbackPath` / `returnUrl`). **`LoginForm` from `@vassembly/ui-login-form` does not define an `onRegisterClick` prop** in its public types; use your layout or login page to link or route to `/register` (for example `Link`, `router.push`, or a secondary button).

Register route example:

```tsx
import { RegisterForm } from '@vassembly/ui-register-form';

export default function RegisterPage() {
  const router = useRouter();
  return (
    <RegisterForm titleId="register-title" onRedirect={(href) => router.replace(href)} />
  );
}
```

App menu:

```tsx
<Link href="/register">Sign up</Link>
```

## Styling and theming

- **SCSS modules**: `RegisterForm.module.scss` (section, form, title, password block), `PasswordStrengthIndicator.module.scss` (strength list and level label).
- **Theme**: Depends on `@vassembly/ui-system-design/theme` (via typography/UI primitives).
- **Consistency**: Mirrors login-form patterns; override root appearance with `className` on `RegisterForm`.

## Accessibility

- Optional `titleId` links the visible **Create Account** heading and `aria-describedby` on email.
- Text fields use labeled controls from `@vassembly/ui-system-design/text-field`.
- Password strength updates are announced via a polite live region.
- Submit `Button` uses `aria-busy` and is disabled while loading.
- Semantic `<form>`; standard Enter-to-submit.

## Hooks and advanced usage (`useRegisterForm`)

Use the hook when building a custom layout but reusing the same state, validation, API, session, and completion behavior.

**Parameters** (`UseRegisterFormParams`): `returnUrl?`, `fallbackPath?`, `onRedirect?`, `onSuccess?` — same semantics as the component.

**Returns** (`UseRegisterFormReturn`): `email`, `password`, `confirmPassword`, `firstName`, `lastName`, `passwordStrength` (`PasswordStrengthResult`: `level`, `hasMinLength`, `hasUppercase`, `hasLowercase`, `hasNumber`, `hasSpecialChar`), `handleEmailChange`, `handlePasswordChange`, `handleConfirmPasswordChange`, `handleFirstNameChange`, `handleLastNameChange`, `handleSubmit`, `isLoading`.

```tsx
const {
  email,
  password,
  confirmPassword,
  firstName,
  lastName,
  passwordStrength,
  handleEmailChange,
  handlePasswordChange,
  handleConfirmPasswordChange,
  handleFirstNameChange,
  handleLastNameChange,
  handleSubmit,
  isLoading,
} = useRegisterForm({
  fallbackPath: '/dashboard',
  onRedirect: (href) => router.replace(href),
  onSuccess: (result) => {
    void persistTokens(result.authToken, result.refreshToken);
  },
});
```

`RegisterForm` also falls back to `validatePasswordStrength(password)` if needed so the indicator always has data.

## Testing

- **78** unit tests (hooks, validation, error formatting, URL resolution, components).
- From this directory: `pnpm test` (or `pnpm exec vitest run`).
- Tests use Vitest, React Testing Library, and mocks for `useRegister`, `useSnackbar`, and `useUserAuth` where appropriate.

Example consumer-style test sketch:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@vassembly/ui-register-form';

it('submits form with valid data', async () => {
  const user = userEvent.setup();
  render(<RegisterForm />);
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'SecurePass1!');
  // … remaining fields and assertions
});
```

## Dependencies and compatibility

**Workspace packages (runtime)**

- `@vassembly/errors` — error typing and classification for message mapping
- `@vassembly/ui-system-design/theme` — design tokens via UI primitives
- `@vassembly/ui-api-hooks` — `useRegister` → `POST /user/register`
- `@vassembly/ui-system-design/button` — submit control
- `@vassembly/ui-system-design/snackbar` — user-facing validation and API messages
- `@vassembly/ui-system-design/text`, `@vassembly/ui-system-design/text-field` — typography and inputs
- `@vassembly/ui-user-auth` — `useUserAuth`, `AuthUser`, `setSession`
- `@vassembly/ui-system-design/utils` — className helper
- `@vassembly/validation` — Zod-based `validatorFactory` for the form schema
- `react`, `react-dom` — **^18**
- `zod` — schema and refinements

**Typical app setup**

- Snackbar provider at the root
- User auth provider
- HTTP client configuration expected by `@vassembly/ui-api-hooks`

## Common patterns

**Next.js App Router**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from '@vassembly/ui-register-form';

export default function RegisterPage() {
  const router = useRouter();
  return (
    <RegisterForm titleId="register-title" fallbackPath="/dashboard" onRedirect={(href) => router.replace(href)} />
  );
}
```

**Analytics on success**

```tsx
<RegisterForm
  onSuccess={(result) => {
    analytics.track('user_registered', { userId: result.user.id });
  }}
/>
```

**Custom label and container class**

```tsx
<RegisterForm className="my-register" submitLabel="Sign up now" />
```

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Module not found for `@vassembly/ui-register-form` | Run `pnpm install` at monorepo root; ensure the app lists this package as a workspace dependency. |
| No redirect after success | Pass `onRedirect` with your router’s `replace`/`push`; otherwise full-page `window.location` is used. |
| Strength indicator empty in a custom UI | Use `passwordStrength` from `useRegisterForm`; it updates from the password state via `useMemo`. |
| Snackbars never appear | Mount `@vassembly/ui-system-design/snackbar` provider above the form. |
| `returnUrl` always ignored | Only same-origin URLs are accepted; others fall back to `fallbackPath`. |

## API reference (exports)

| Export | Kind | Purpose |
|--------|------|---------|
| `RegisterForm` | Component | Full registration UI |
| `useRegisterForm` | Hook | State, validation, API, session, completion |
| `RegisterFormProps` | Type | Component props |
| `RegisterFormSubmitResult` | Type | `onSuccess` payload (tokens + user + flags) |
| `RegisterNavigateFn` | Type | `(href: string) => void` navigation callback |

---

**Publication checklist**

- Overview, setup, and imports
- Usage examples (basic, `onSuccess`, `returnUrl`)
- Props, hook parameters/returns, success type (including tokens)
- Validation rules and messages; API error mapping
- Password strength and a11y
- Post-registration sequence; navigation
- Styling; testing commands; dependencies
- Troubleshooting and export table

This README matches the current `src` implementation and is ready for package consumers.
