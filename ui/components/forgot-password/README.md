# @vassembly/ui-forgot-password

## Overview

`@vassembly/ui-forgot-password` provides a **forgot-password** flow for the Vassembly monorepo: an email-only form, client-side validation, integration with the forgot-password HTTP API via [`@vassembly/ui-api-hooks`](../../api-hooks/), and **success/error feedback** through [`@vassembly/ui-system-design/snackbar`](../../system-design/snackbar/). The UI is split so [`ForgotPasswordForm`](#component-api--forgotpasswordform) stays presentational while [`useForgotPasswordForm`](#hook-api--useforgotpasswordform) owns state, submission, and side effects (including a **completion effect** that maps API results to snackbars and optional `onSuccess`).

## Installation

In a workspace package that already depends on the Vassembly monorepo, add the package to `dependencies`:

```json
{
  "dependencies": {
    "@vassembly/ui-forgot-password": "workspace:*"
  }
}
```

Then install from the repo root (e.g. `pnpm install`). The form **must** be rendered under React 18+ with the **HTTP client** and **snackbar** providers (see [Examples](#examples)).

## Dependencies

- **react** / **react-dom**: Component and hook runtime.
- **zod**: Email schema in [`validateForgotPasswordForm.ts`](./src/validateForgotPasswordForm.ts).
- **@vassembly/ui-system-design/button**, **@vassembly/ui-system-design/text**, **@vassembly/ui-system-design/text-field**: Submit button, headings, and email field.
- **@vassembly/ui-system-design/snackbar**: `useSnackbar` for validation errors, API success, and API/transport errors.
- **@vassembly/ui-system-design/utils**: `resolveClassName` for optional root `className`.
- **@vassembly/ui-api-hooks**: `useForgotPassword` and `HttpClientProvider` for the forgot-password request.
- **@vassembly/validation**: `validatorFactory` wrapping the Zod schema.
- **@vassembly/errors**: `CommonError` and `ErrorTypes` in the completion effect and error formatting.
- **@vassembly/ui-system-design/theme**: Theme/tokens (via the UI primitives above).

## Component API — `ForgotPasswordForm`

Renders the forgot-password UI: either the **form** (email field + submit) or a **success** message after a successful response. Styling uses **CSS Modules** and theme-backed components (aligned with other auth forms such as login).

### Props (`ForgotPasswordFormProps`)

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Optional heading shown above the field. |
| `titleId` | `string` | Optional id for the title; used for `aria-describedby` on the form and email field when `title` is set. |
| `className` | `string` | Merged with the root section class (see [Styling](#styling)). |
| `submitLabel` | `string` | Overrides the default **Send reset link** label on the submit button. |
| `onSuccess` | `() => void` | Called **after** a successful API completion, **after** the success snackbar is shown (same timing as in the hook). |

### Behavior

- **Email only** — no password field; field is disabled while the request is in flight; submit button shows loading/disabled state (`isLoading` from the hook).
- **Success state** — on success, the form is replaced by a static success message (see [`constants.ts`](./src/constants.ts) for default copy).
- **Snackbar** — not rendered by this component; [`useForgotPasswordForm`](./src/useForgotPasswordForm.ts) uses `useSnackbar()` for validation errors and API completion.

## Hook API — `useForgotPasswordForm`

**Signature:** `useForgotPasswordForm(params: UseForgotPasswordFormParams): UseForgotPasswordFormReturn`

### Parameters

| Field | Type | Description |
|-------|------|-------------|
| `onSuccess` | `() => void` | Optional; invoked when the forgot-password request completes successfully (see [Completion effect](#completion-effect)). |

### Return value

| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | Current email value. |
| `handleEmailChange` | `(value: string) => void` | Updates `email` (use from your own inputs). |
| `handleSubmit` | `(event: FormEvent<HTMLFormElement>) => Promise<void>` | Call on form submit (`preventDefault` is handled inside). |
| `isLoading` | `boolean` | `true` while the underlying `useForgotPassword` request is in progress. |
| `isSuccess` | `boolean` | `true` after a **successful** API response; use to swap UI or run follow-up logic. |

### API integration

The hook uses [`useForgotPassword`](../../api-hooks/src/auth/useForgotPassword.ts) from `@vassembly/ui-api-hooks`, which **POSTs** to `/user/forgot-password` with `{ email }`. Loading and result state come from that hook’s `fetch` / `isLoading` / `data` / `error`.

### Completion effect

[`useForgotPasswordFormCompletionEffect`](./src/useForgotPasswordFormCompletionEffect.ts) runs after a submit when the fetch **finishes**:

1. If there is an **error** — shows an **error** snackbar with [`formatForgotPasswordErrorMessage`](#error-handling--formatforgotpassworderrormessage); `isSuccess` stays `false`.
2. If the response is missing or `ok` is false — shows a **generic** error snackbar; `isSuccess` stays `false`.
3. If the response is successful — sets `isSuccess` to `true`, shows a **success** snackbar (API `message` or a privacy-aware fallback; see [constants](./src/constants.ts)), then calls `onSuccess` if provided.

A ref gate ensures this logic runs only for completions triggered by the form (not spurious effect runs while loading).

## Validation — `validateForgotPasswordForm`

**Note:** `validateForgotPasswordForm` is used internally by the hook and is **not** re-exported from the package entry ([`index.ts`](./src/index.ts)). Documented here for **behavioral parity** and **testing** reference.

- Implemented in [`validateForgotPasswordForm.ts`](./src/validateForgotPasswordForm.ts) with [Zod](https://zod.dev/) and `@vassembly/validation`’s `validatorFactory`.
- **Rules:**
  - Email is **required** (after trim).
  - Email must be a **valid address** (Zod `.email()`).
- **User-facing messages** (first failure wins): e.g. `Email is required.`, `Enter a valid email address.`
- On failure, the hook shows the message in an **error** snackbar before calling the API.

## Error handling — `formatForgotPasswordErrorMessage`

**Note:** Like validation, this helper is **internal** to the package ([`formatForgotPasswordErrorMessage.ts`](./src/formatForgotPasswordErrorMessage.ts)) but its behavior matters for support and UX.

- **Network / transport:** “Unable to connect…”, “Connection timed out…”, or messages mentioning “network” map to safe, user-friendly strings.
- **Privacy-aware generic copy:** `NOT_FOUND`, `UNAUTHORIZED`, other **4xx** (client errors), and **5xx** map to a **single generic** message — **no** enumeration of whether an account exists.
- The hook also uses a generic error when the response body is present but `ok` is not true.

Together with the [success snackbar fallback](./src/constants.ts) (“If an account exists, you will receive an email…”), the flow avoids leaking account enumeration details in obvious UI copy.

## Accessibility

- **Form:** `<form>` with `role="form"`; optional `aria-describedby` pointing at the title id when a title is provided.
- **Success:** Success content is in a `role="status"` region with `aria-live="polite"` and `aria-atomic="true"` so screen readers announce the outcome.
- **Email field:** `type="email"`, `autoComplete="email"`, `inputMode="email"`, large size, full width; disabled while loading.
- **Submit:** `aria-busy` while loading; button disabled during loading to avoid double submit.
- **Keyboard:** Standard tab order and Enter to submit; loading state does not remove focusable controls without disabling appropriately on the field/button.

## Styling

- **CSS Module:** [`ForgotPasswordForm.module.scss`](./src/ForgotPasswordForm.module.scss) — layout for container, form, title, and success message.
- **Root class:** `className` is merged with the module `container` via `resolveClassName` from [`@vassembly/ui-system-design/utils`](../../system-design/utils).
- **Theme:** Colors and typography come from **Vassembly UI** primitives ([`@vassembly/ui-system-design/text`](../../system-design/text/), [`@vassembly/ui-system-design/text-field`](../../system-design/text-field/), [`@vassembly/ui-system-design/button`](../../system-design/button/)) and [`@vassembly/ui-system-design/theme`](../../system-design/theme) where those components use tokens.

## Examples

### Basic usage (providers required)

```tsx
import { HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
import { ForgotPasswordForm } from '@vassembly/ui-forgot-password';

export function ForgotPasswordPage() {
  return (
    <HttpClientProvider config={{ baseUrl: import.meta.env.VITE_API_BASE_URL }}>
      <SnackbarProvider position="bottom-left">
        <ForgotPasswordForm
          title="Reset your access"
          titleId="forgot-password-title"
        />
      </SnackbarProvider>
    </HttpClientProvider>
  );
}
```

### Hook-only usage (custom layout)

```tsx
import { FormEvent } from 'react';
import { HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
import { useForgotPasswordForm } from '@vassembly/ui-forgot-password';

function CustomForgotForm() {
  const { email, handleEmailChange, handleSubmit, isLoading, isSuccess } = useForgotPasswordForm({});

  if (isSuccess) {
    return <p>Check your email.</p>;
  }

  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        void handleSubmit(e);
      }}
    >
      <input
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        disabled={isLoading}
        type="email"
        autoComplete="email"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}

// Wrap with the same providers as in the basic example.
```

### Custom `className`, button label, and `onSuccess`

```tsx
<ForgotPasswordForm
  className="my-forgot-page-panel"
  titleId="forgot-title"
  submitLabel="Email me a link"
  onSuccess={() => {
    // e.g. analytics, soft navigation — runs after success snackbar
  }}
/>
```

## Testing

- **This package** runs [Vitest](https://vitest.dev/) with **47** tests across:
  - [`useForgotPasswordForm.test.ts`](./src/useForgotPasswordForm.test.ts) — hook, API wiring, completion effect.
  - [`validateForgotPasswordForm.test.ts`](./src/validateForgotPasswordForm.test.ts) — Zod rules.
  - [`formatForgotPasswordErrorMessage.test.ts`](./src/formatForgotPasswordErrorMessage.test.ts) — error mapping.
  - Component tests: [render](./src/ForgotPasswordForm.render.test.tsx), [interactions](./src/ForgotPasswordForm.interactions.test.tsx), [accessibility](./src/ForgotPasswordForm.accessibility.test.tsx).
- **From a consumer app:** wrap components under the same **providers** and mock `HttpClientProvider`’s client or the network as your app tests do for other `ui-api-hooks` forms. Assert **snackbar** calls if you use `useSnackbar` mocks, or assert UI state (`isSuccess`, disabled inputs) when testing `useForgotPasswordForm` in isolation.

```bash
pnpm --filter @vassembly/ui-forgot-password test
```

## Storybook

Stories live in [`ForgotPasswordForm.stories.tsx`](./src/ForgotPasswordForm.stories.tsx) (`Components/ForgotPasswordForm`), with decorators for `HttpClientProvider` and `SnackbarProvider`. Use them as a **visual and interaction** reference for default, titled, custom label, and `onSuccess` scenarios.

## Related packages

| Package | Role |
|---------|------|
| [`@vassembly/ui-api-hooks`](../../api-hooks/) | `useForgotPassword`, `HttpClientProvider` |
| [`@vassembly/ui-system-design/snackbar`](../../system-design/snackbar/) | `SnackbarProvider`, `useSnackbar` |
| [`@vassembly/ui-system-design/button`](../../system-design/button/) | Submit button |
| [`@vassembly/ui-system-design/text`](../../system-design/text/) | Title and success text |
| [`@vassembly/ui-system-design/text-field`](../../system-design/text-field/) | Email field |
| [`@vassembly/ui-system-design/utils`](../../system-design/utils) | `resolveClassName` |
| [`@vassembly/validation`](../../../packages/validation) | `validatorFactory` + Zod |
| [`@vassembly/ui-system-design/theme`](../../system-design/theme) | Theming (via UI primitives) |
| [`@vassembly/errors`](../../../packages/errors) | `CommonError`, `ErrorTypes` in completion/error handling |

## Public API summary

| Export | Kind |
|--------|------|
| `ForgotPasswordForm` | Component |
| `useForgotPasswordForm` | Hook |
| `ForgotPasswordFormProps` | Type (component props) |

`UseForgotPasswordFormParams` and `UseForgotPasswordFormReturn` are defined in [`types.ts`](./src/types.ts) for implementation but are **not** re-exported from [`index.ts`](./src/index.ts). Derive or duplicate types in app code with `Parameters<typeof useForgotPasswordForm>` / `ReturnType<typeof useForgotPasswordForm>` if needed.

**File location:** [README.md](./README.md) at `ui/components/forgot-password/README.md`.
