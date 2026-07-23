# Reset password flow — architecture

## Analysis

### Web app (`apps/web`, `@vassembly/web`)

- **Next.js App Router**, client pages for auth: `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`, plus `ProtectedAuthRoute` and `middleware.ts` treating `/login`, `/register`, `/forgot-password` as public auth routes (redirect when session cookie exists).
- **Pattern:** `"use client"` page → composes a package from `ui/components/*` → passes `router` callbacks (`replace`/`push`), optional `Suspense`, `ProtectedAuthRoute` so logged-in users are redirected away.
- **Gap:** No route yet for **token-bearing reset** (new password step). Middleware must whitelist that path similarly to other auth pages.

### Existing UI — forms and hooks

| Asset | Role |
|-------|------|
| `@vassembly/ui-login-form` | Email + password; links to `/forgot-password` and `/register`; `useLogin` + completion effect pattern. |
| `@vassembly/ui-forgot-password` | Email-only; `useForgotPassword` → `POST /user/forgot-password`; snackbar errors/success (constants in package). |
| `@vassembly/ui-register-form` | Password + confirm + **strength** (`validatePasswordStrength`, etc.) — reuse rules/UX for “new password” on reset screen. |
| System design primitives | `@vassembly/ui-system-design/button`, `@vassembly/ui-system-design/text-field`, `@vassembly/ui-system-design/text`, `@vassembly/ui-system-design/snackbar`, `@vassembly/ui-system-design/icons`, `@vassembly/ui-system-design/utils`. |

### API and services (current gap)

- **`apps/api/src/routes/index.ts`** only mounts `login` and `register` under `/user` — **no** `forgot-password` despite the frontend hook (`ui/api-hooks/src/auth/useForgotPassword.ts` calls `/user/forgot-password`).
- **`@vassembly/service-auth`** exposes `login`, `register`, `auth`, `refresh`, `getUser`, `logout` — **no** forgot/reset handlers.
- **Domains:** `@vassembly/domain-user` has `create` (password hashing + `hasValidPassword` rules), `verifyCredentials`, generic `update` (firstName, lastName, verifiedAt only — **not** password hash). `@vassembly/domain-auth-token` / `@vassembly/domain-refresh-token` serve **session** auth, not one-time reset links.

### What can be reused vs built

**Reuse:**

- Forgot-password **screen** stays `ForgotPasswordForm` + `/forgot-password` page once the API exists.
- **Visual/interaction patterns** from `LoginForm` / `ForgotPasswordForm`: same primitives, snackbar formatting pattern, loading guards.
- **Password policy** alignment with registration: mirror `domains/user/src/commands/create` validation (consider extracting shared Zod/password helper used by create + reset to avoid drift, if small).
- **HTTP client hooks** pattern in `@vassembly/ui-api-hooks`: `useFetch` + typed body/response like `useForgotPassword`.

**Must be new (end-to-end):**

- Persistence for **reset token** (hashed token + expiry on user document, or dedicated collection/domain — see decisions).
- Domain operations: issue token, consume token + set new password hash, invalidate token.
- Service handlers + API routes for: request reset, validate token (optional separate GET if UX needs pre-check), apply new password (POST with token + new password).
- UI package for **reset password form** (new password + confirm) and **`apps/web`** page with token from query param (recommended: `?token=` on `/reset-password` to avoid nested dynamic segments and keep middleware simple).

---

## Architecture & package placement

### Data flow (target)

```
Web: ForgotPasswordForm → POST /user/forgot-password → service-auth forgotPassword
  → user domain (+ email client e.g. SES template "reset-password" already named in packages/client-aws-ses tests)

Web: ResetPasswordForm (?token=) → POST /user/reset-password → service-auth resetPassword
  → validate token → user domain update password hash → clear reset fields

(Optional) GET /user/reset-password/validate?token= → { valid: boolean } for UX before showing form
```

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **domain-user** | Store hashed reset token + expiry; commands to set reset request, validate and consume token, persist new `passwordHash` using same hashing as create; **never** expose raw token from queries. |
| **service-auth** | Orchestrate forgot (lookup user by email — uniform response time), enqueue/send email with link containing token; orchestrate reset (validate + update password). |
| **apps/api** | Thin Fastify routes + Zod body/query schemas; delegate to handlers. |
| **ui-api-hooks** | `useForgotPassword` (already), add `useResetPassword`, optional `useValidateResetToken`. |
| **ui/components/reset-password-form** (new) | Presentational + hook mirroring forgot/login structure. |
| **apps/web** | `app/reset-password/page.tsx` reading `token` from search params; extend `middleware.ts` matcher + `AUTH_PAGES`. |

### Cross-dependencies

- `service-auth` → `domain-user` (+ `@vassembly/client-aws-ses` or existing mail abstraction if present).
- `ui-reset-password-form` → `ui-api-hooks`, system-design inputs, optionally import **types-only** from register-form if password validation is shared; otherwise duplicate minimal client-side validation consistent with backend (prefer single shared `@vassembly/...` validator only if extraction is trivial).

---

## Recommendation

**Most conservative product path:**

1. **Extend `@vassembly/domain-user`** with reset-token fields on the model + dedicated commands (e.g. `requestPasswordReset`, `completePasswordReset`) rather than a new domain, unless reset tokens must be audited separately — keeps “user credentials” cohesion.
2. **Implement missing backend first** (`forgot-password` + `reset-password` routes), then wire existing forgot UI (already shipped) and add the new reset form page.
3. **New UI package** `reset-password-form` parallel to `forgot-password` / `login-form` — avoids overloading `@vassembly/ui-forgot-password` with token URL state and different fields.
4. **Token delivery:** opaque random token hashed at rest (`crypto.randomBytes` + bcrypt/argon-style hash consistent with codebase); URL `https://app/reset-password?token=plaintext` only in email; backend compares hash.
5. **Security UX:** Forgot endpoint returns generic success whether or not email exists (reuse message already in forgot-password constants).

---

## Implementation steps (ordered)

1. **domain-user**: Add optional `passwordResetTokenHash`, `passwordResetExpiresAt` to model/schema; commands to set/challenge/clear those fields and update password with rehash; unit tests (black-box). Reuse hashing helper pattern from `commands/create/index.ts`.
2. **service-auth**: Handlers `forgotPassword`, `resetPassword` (+ optional `validateResetToken`) with typed inputs/outputs; tests with mocked domains + mail.
3. **apps/api**: Add `routes/user/forgot-password.ts`, `routes/user/reset-password.ts` (+ optional validate); wire in `routes/index.ts`.
4. **ui-api-hooks**: Export hooks for new endpoints; tests parallel to `useForgotPassword.test.ts`.
5. **ui/components/reset-password-form**: Scaffold package (Storybook optional follow-up); `ResetPasswordForm` props: `token` (required from page), optional `titleId`, `onSuccess` redirect to `/login`; hook + completion effect; client validation aligned with register.
6. **apps/web**: `app/reset-password/page.tsx` with `Suspense` + `useSearchParams().get('token')`; redirect to `/forgot-password` if missing token; extend `middleware.ts` (`AUTH_PAGES` + matcher).
7. **Email**: Connect handler to SES (or noop in dev behind config) using existing template name if infrastructure allows.

---

## Design decisions / trade-offs

| Decision | Option A (chosen leaning) | Option B | Trade-off |
|----------|--------------------------|----------|-----------|
| Token storage | Fields on **user** document | Separate `password-reset` domain/collection | Simpler queries; coupling to user lifecycle acceptable for MVP |
| User `update.ts` generic command | Do **not** add `passwordHash` to generic update | Extend Zod schema | Sensitive field should only change through dedicated audited command |
| Validate token endpoint | Single **POST reset-password** that returns typed errors vs optional **GET** validate | Frontend infers validity only from submit | Extra GET improves UX (disable form early) at cost of one more route |
| URL shape | **`/reset-password?token=`** | `/reset-password/[token]` | Query param avoids Next dynamic segment + middleware glob edge cases |

---

## Todo Plan

1. **`@vassembly/domain-user`** — Type: domain extension  
   - Changes needed: Model + Mongo mapping for reset fields; commands `requestPasswordReset`, `completePasswordReset` (names flexible); reuse hash/compare utilities from create flow; exported via `commands` index.  
   - Files to modify/create: `domains/user/src/model/model.ts`, `domains/user/src/model/factories.ts`, `domains/user/src/clients/` if schema migration helpers, `domains/user/src/commands/*.ts`, `domains/user/src/commands/index.ts`, tests colocated.  
   - Suggested subagent workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer (README if behavior warrants).  
   - Dependencies: None  

2. **`@vassembly/service-auth`** — Type: service extension  
   - Changes needed: `forgotPassword`, `resetPassword` handlers (+ types/tests); optionally email send integration behind interface.  
   - Files to modify/create: `services/auth/src/handlers/forgotPassword/`, `resetPassword/`, `services/auth/src/handlers/index.ts`, `services/auth/src/index.ts` if re-exports change.  
   - Suggested subagent workflow: unit-test-writer → coder ↔ code-reviewer  
   - Dependencies: Todo 1  

3. **`apps/api`** — Type: API gateway  
   - Changes needed: New route files under `apps/api/src/routes/user/`; register in `apps/api/src/routes/index.ts`.  
   - Suggested subagent workflow: coder → code-reviewer  
   - Dependencies: Todo 2  

4. **`@vassembly/ui-api-hooks`** — Type: client hooks  
   - Changes needed: `useResetPassword`, types; optional `useValidateResetPasswordToken`; barrel `auth/index.ts` + tests.  
   - Suggested subagent workflow: unit-test-writer → coder → code-reviewer  
   - Dependencies: Todo 3  

5. **`@vassembly/ui-reset-password-form`** (new package under `ui/components/reset-password-form`) — Type: new UI component package  
   - Changes needed: Package scaffold (`package.json`, `src/index.ts`, form + hook + validation + SCSS mirroring sibling forms); Stories if project convention requires.  
   - Suggested subagent workflow: create-package skill / coder scaffolding → coder implementation → unit-test-writer for hook/validation → code-reviewer  
   - Dependencies: Todo 4  

6. **`@vassembly/web`** — Type: app integration  
   - Changes needed: `app/reset-password/page.tsx`; `middleware.ts` auth page list/matcher; link from email constructed in service (outside repo or env base URL).  
   - Suggested subagent workflow: coder → code-reviewer  
   - Dependencies: Todo 5  

7. **Email / infra** (if separate package) — Type: integration  
   - Changes needed: Wire `service-auth` forgot handler to SES or queue; env for public web base URL.  
   - Suggested subagent workflow: coder  
   - Dependencies: Todo 2  

---

## Component structure (reset password UI)

### `ResetPasswordForm` (proposed props)

```ts
interface ResetPasswordFormProps {
  token: string;
  titleId?: string;
  className?: string;
  submitLabel?: string;
  onSuccess?: () => void; // page passes () => router.replace('/login')
}
```

- Hook `useResetPasswordForm({ token, onSuccess })` owns password/confirm state, calls `useResetPassword` from api-hooks, snackbar + completion effect analogous to `useForgotPasswordFormCompletionEffect`.
- **Integration:** Page reads `token` via `useSearchParams()`; if absent, redirect to `/forgot-password` with optional query hint.

---

## Librarian/consistency notes

- Confirmed partial implementation: forgot UI + hook exist; **API routes and token lifecycle are missing**.
- Align new routes under `/user/*` with existing `login` and `register` for discoverability (`forgot-password`, `reset-password`).
- SES client tests reference template name `reset-password` — prefer reusing that name when configuring the email body/link.
