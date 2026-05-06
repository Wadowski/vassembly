# Product Requirements Document: Reset Password (Vassembly)

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-05-05  
**Architecture reference:** [architecture.md](./architecture.md)  
**Related:** [User registration PRD](../user-registration/prd.md) (password policy alignment)

---

## 1. Overview & user story

### 1.1 Problem statement

Users who have forgotten their password or can no longer sign in need a **self-serve, secure path** to regain access without administrator intervention. Without a complete reset flow (request → email link → new password → sign-in), users are blocked, support cost rises, and trust in account recovery erodes.

### 1.2 User value proposition

- **Access recovery:** A known email address is enough to start recovery; the user sets a new password via a time-limited link.
- **Predictable experience:** Copy, validation, and visual patterns match **login**, **forgot password**, and **registration** so users are not relearning rules.
- **Safety by design:** The product does not confirm whether an email is registered on the request step; tokens are opaque, single-use, expiring, and stored only in hashed form; passwords are never logged or returned.

### 1.3 In-scope summary

- **Forgot password** page: collect email, submit to backend, show **generic** success (and non-enumerating error handling per security section).
- **Email delivery:** Message contains a link to the web app using **`/reset-password?token=<plaintext token>`** (plaintext **only** in the email and in transit to the server on submit — **never** persisted or exposed in APIs as stored values).
- **Reset password** page: read `token` from query string; new password + confirm; submit; success path directs user toward **login** (or equivalent post-reset entry).
- **Backend:** Persist hashed token + expiry on the **user** document; orchestrate mail (e.g. **Amazon SES**) using an agreed template name (e.g. `reset-password` per architecture notes).
- **Optional UX enhancement:** **`GET /user/reset-password/validate`** (or equivalent) to pre-check token validity before or while showing the form.

### 1.4 Out-of-scope (summary — see Section 9)

Multi-factor recovery, passwordless-only recovery, arbitrary account takeover without email proof, admin-initiated resets, and security questions.

---

## 2. User flows

### 2.1 Happy path — forgot password initiation (email entry)

1. User opens **Forgot password** (e.g. from login).
2. User enters email and submits; UI prevents double submit and shows loading.
3. Backend accepts the request; response is **successful and generic** (same user-visible outcome whether or not the email exists — see §3.4).
4. UI shows success messaging consistent with `@vassembly/ui-forgot-password` / product copy (already aligned with generic success).

### 2.2 Email receipt and token validation

1. If the email is associated with an account eligible for reset, the user receives an email containing a single-use reset link shaped as **`{WEB_BASE_URL}/reset-password?token={token}`**.
2. User opens the link in a browser; the reset page loads.
3. **If optional validate endpoint exists:** client may call it to show invalid/expired token state before typing passwords; otherwise validity is determined at submit.

### 2.3 New password entry and confirmation

1. Reset page reads **`token`** from search params (`useSearchParams` / SSR-safe patterns per app conventions).
2. If **`token`** is missing, user is redirected (e.g. to **forgot password**) instead of showing an infinite form state.
3. User enters **new password** and **confirm password**; client validation mirrors **registration** rules (§3.3).
4. User submits; UI shows loading; client sends **`token` + `password`** to complete reset (**confirm** validated client-side — server validates password policy).

### 2.4 Success confirmation and redirect

1. On successful reset, persisted password is updated, reset token fields are **cleared**, and the user can sign in with the new password.
2. UI shows brief success feedback (snackbar or inline) and navigates to **login** (e.g. `router.replace('/login')`) unless product policy specifies otherwise.
3. Old reset links **must not** work after successful completion.

### 2.5 Error-oriented flow highlights

- **Invalid / expired token:** User sees a clear message and a path back to **forgot password** to request a new email (no leaking of internal IDs).
- **Weak password / validation:** Inline and/or snackbar messaging; map server validation to the same fields as registration where possible.
- **Network / server errors:** Retry-friendly generic messaging; distinguish offline when detectable.

---

## 3. Requirements

### 3.1 Functional requirements

| Area | Requirement |
|------|-------------|
| **Forgot POST** | Accept **email**; validate format; delegate to auth service; return **generic** payload (see §5). |
| **Reset POST** | Accept **`token`** (non-empty string) and **`password`**; validate password policy server-side; on success update password hash, clear reset fields, return minimal safe user projection if contract requires (see §5). |
| **Token lifecycle** | Opaque random token; **hash** stored on user **`passwordResetTokenHash`**; **`passwordResetExpiresAt`** enforced; compare hash on completion; single-use consume clears token data. |
| **Email** | Send only when user exists (and policy allows); link uses **`?token=`** query param; template name aligned with infra (e.g. `reset-password`). |
| **Middleware / routing** | **`/reset-password`** treated as a **public auth page** (like login/register/forgot); logged-in users redirected per existing **ProtectedAuthRoute** / session rules. |
| **Password rules** | **Reuse registration policy** — minimum length (e.g. ≥8), character-class or strength rules, and **same** server-side enforcement as `domains/user` create flow; client rules stay in sync (shared validator preferred if already extracted). |
| **Generic forgot response** | Do not reveal “email not found” vs “email sent” on the request endpoint; maintain **uniform response time** behavior per architecture (mitigate timing enumeration). |

### 3.2 Non-functional requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Forgot and reset endpoints respond within typical API SLOs; email send may be async/queued if product allows — user still sees immediate generic success for forgot. |
| **Availability** | Degraded email must not crash forgot handler; errors logged server-side without PII/secrets. |
| **Accessibility (a11y)** | Forms use labels, error associations, focus order, and keyboard operability consistent with login/register; password fields support visibility toggle if design system provides it. |
| **Responsive design** | Layouts work at mobile and desktop breakpoints using existing layout + form components. |
| **Persistence** | Reset token state lives on the **user document** (see §6); no separate user-facing “draft” for reset beyond browser session. |
| **Logging** | Never log plaintext passwords, raw reset tokens, or password hashes. |

### 3.3 Acceptance criteria (high level)

- [ ] End-to-end: request reset → receive email (in env where SES/delivery works) → open link → set password → login succeeds.
- [ ] Forgot endpoint returns the **same** user-visible success for unknown email as for known email (copy + HTTP success).
- [ ] Expired and invalid tokens cannot complete reset; user is guided to request a new link.
- [ ] Successful reset **invalidates** the token for reuse.
- [ ] Password policy matches registration (client + server).
- [ ] **No** reset token or password material in client console logs or network responses beyond one-time submit payload for password (never store token in localStorage for long-term reuse).
- [ ] Authenticated users hitting **forgot** or **reset** public routes behave per existing auth guard rules.

---

## 4. Use cases (Gherkin)

### 4.1 Primary use cases

```gherkin
Scenario: User requests password reset with a registered email
  Given the user is on the forgot password page
  And the entered email belongs to an existing account
  When the user submits a valid email address
  Then the UI shows generic success messaging
  And the user receives an email containing a reset link with a token query parameter

Scenario: User completes reset with a valid token and strong password
  Given the user opened a reset link with a valid unexpired token
  When the user enters a new password and matching confirmation that satisfy the registration password policy
  And the user submits the reset form
  Then the password is updated and reset token fields are cleared
  And the user is directed toward the login experience
  And the user can sign in with the new password

Scenario: User requests password reset with an unknown email
  Given the user is on the forgot password page
  And the entered email does not belong to any account
  When the user submits the form
  Then the UI shows the same generic success messaging as for a registered email
  And no password reset email is sent to that address
```

### 4.2 Secondary use cases

```gherkin
Scenario: Logged-in user navigates to forgot password
  Given an authenticated session exists
  When the user visits the forgot password page
  Then the application redirects them according to public auth routing rules

Scenario: User opens reset page without a token
  Given the user navigates to the reset password route
  And the URL has no token query parameter
  When the page loads
  Then the user is redirected to forgot password or another defined recovery entry point

Scenario: Optional token pre-validation reports invalid token
  Given the optional validate endpoint is implemented
  And the token is invalid or expired
  When the client requests validation before submit
  Then the UI shows that the link is invalid or expired
  And the user can navigate to request a new reset email
```

---

## 5. Edge cases & error handling (Gherkin)

```gherkin
Scenario: Expired reset token
  Given the reset token has passed passwordResetExpiresAt
  When the user submits the reset form
  Then the server rejects the reset
  And the user sees a non-technical message explaining the link expired
  And the user can start over from forgot password

Scenario: Reused reset token after successful reset
  Given the user already completed a successful password reset for that token
  When the user attempts to submit the same token again
  Then the server rejects the reset
  And the user is instructed to request a new link if needed

Scenario: Password fails server-side policy
  Given the token is valid
  When the user submits a password that fails server validation
  Then the response maps to field-level or form-level messaging
  And no change is made to the stored password or token state

Scenario: Password and confirmation mismatch (client)
  Given the user is on the reset form
  When the confirmation field does not match the password field
  Then submit is blocked or validation errors are shown before the request is sent

Scenario: Connectivity loss during submit
  Given the user is completing reset
  When the network request fails or times out
  Then the UI shows a connectivity-oriented message
  And the user can retry without losing context where the design allows

Scenario: Email delivery failure for a valid user (server-side)
  Given the email belongs to a valid user
  When the mail provider fails to send
  Then the user still receives the generic forgot success response
  And the failure is handled server-side without exposing internals
```

---

## 6. API specification

Base path aligns with existing user routes: **`/user`** prefix in the API gateway (full paths **`POST /user/forgot-password`** and **`POST /user/reset-password`**).

### 6.1 `POST /user/forgot-password` — request reset

| Item | Specification |
|------|----------------|
| **Body** | `{ "email": string }` — email format validated (e.g. Zod email). |
| **Success** | `200` (or product-standard 2xx) with a **generic** body, e.g. `{ "message": string }` — same message whether user exists or not. |
| **Client errors** | `400` for malformed body; rate limiting / abuse responses per platform policy (non-enumerating). |
| **Server errors** | `5xx` with generic client messaging; no stack traces or secrets. |

### 6.2 `POST /user/reset-password` — complete reset

| Item | Specification |
|------|----------------|
| **Body** | `{ "token": string, "password": string }` — token non-empty; password non-empty before domain policy checks. |
| **Success** | `200` with a minimal safe payload (e.g. `{ "user": { ...public fields } }` per login/register conventions — **never** password hash or token fields). |
| **Client errors** | `400` validation; `401`/`404`/`410` or mapped typed errors for invalid/expired token **without** revealing whether email exists. |
| **Server errors** | `5xx` generic handling. |

### 6.3 Optional: `GET /user/reset-password/validate` — token validation

| Item | Specification |
|------|----------------|
| **Query** | `token` (non-empty string). |
| **Success** | `200` with `{ "valid": boolean }` (and optionally coarse reason enums for UX if product allows without enumeration abuse). |
| **Purpose** | Allow the UI to disable the form or show early “link expired” messaging; omit if product accepts validation only on POST. |

---

## 7. Data model

Fields on the **user** document (names align with architecture; exact schema owned by **`@vassembly/domain-user`**):

| Field | Purpose |
|-------|---------|
| **`passwordResetTokenHash`** | Stores **hash** of the opaque token; **never** the plaintext token. |
| **`passwordResetExpiresAt`** | Absolute expiry for the reset request; enforce on validate/complete. |

**Authoritative credential field:** Existing **`passwordHash`** (or equivalent) is updated **only** through the dedicated reset completion path — **not** via generic profile update commands.

**Queries:** Domain must **never** expose the raw issued token from read models or APIs.

---

## 8. UI/UX design notes

- **Reuse** patterns from **`LoginForm`**, **`ForgotPasswordForm`**, and **`RegisterForm`**: primitives (`Button`, `TextField`, `Snackbar`), loading/disabled submit, snackbar formatting, completion-effect pattern (`useForgotPassword` / analogous reset hook).
- **New package:** **`reset-password-form`** (or equivalent) holds the reset-specific fields and hook; forgot package remains email-only.
- **URL:** **`/reset-password?token=`** (query param) to avoid nested dynamic route and middleware complexity.
- **Missing token:** Redirect to **`/forgot-password`** (optional query hint for analytics only — avoid sensitive data in query strings).
- **Success:** Brief confirmation then **`replace`** to login to reduce back-navigation to stale token pages.
- **Errors:** Distinguish client validation vs server/auth errors visually; align copy with registration for password strength messaging.

---

## 9. Success metrics & testing

### 9.1 Success metrics (observable)

| Metric | Definition | Target direction |
|--------|------------|------------------|
| **Reset completion rate** | Successful `POST /user/reset-password` / distinct valid reset emails or sessions started | Increase; segment by expiry window |
| **Time to regain access** | p50/p95 from forgot submit to successful login after reset | Lower within security constraints |
| **Invalid token rate** | Submissions rejected for token reasons / total reset attempts | Monitor; informs email latency and copy |
| **Client validation friction** | Blocked submits for password mismatch or policy / total submits | Lower via clear inline guidance |
| **Error taxonomy** | 4xx (validation vs token) vs 5xx vs network on reset | Minimal unexplained 5xx |

### 9.2 End-to-end validation (QA)

- **Smoke:** Forgot → (test inbox or mail sink) → open link → reset → login with new password.
- **Regression:** Login, register, session refresh, and forgot-password pages unchanged except intended linking and middleware lists.
- **Security spot-checks:** Unknown email forgot response matches known email; timing behavior reviewed; token not present in persistence or logs; expired link rejected.
- **a11y:** Keyboard path through both forms; screen reader announces errors tied to fields.

---

## 10. Dependencies & implementation sequence

Ordered build path (matches [architecture.md](./architecture.md)):

1. **`@vassembly/domain-user`** — Model fields `passwordResetTokenHash`, `passwordResetExpiresAt`; commands to request reset (set hash + expiry), complete reset (verify hash + expiry, update `passwordHash`, clear token fields); tests; reuse hashing/compare approach from user create.
2. **`@vassembly/service-auth`** — Handlers **`forgotPassword`**, **`resetPassword`** (+ optional **`validateResetToken`**); orchestrate user lookup by email (uniform timing), email send (SES / noop in dev), and domain completion; tests with mocked mail/domain.
3. **`apps/api`** — Thin routes: `POST /user/forgot-password`, `POST /user/reset-password`, optional `GET /user/reset-password/validate`; Zod schemas; register in route index.
4. **`@vassembly/ui-api-hooks`** — `useForgotPassword` (if not already wired), `useResetPassword`, optional `useValidateResetToken`; types and tests.
5. **`@vassembly/ui-reset-password-form`** — Form + hook + styles mirroring sibling auth forms; client validation aligned with registration.
6. **`@vassembly/web`** — `app/reset-password/page.tsx` with `Suspense` / search params; extend **`middleware.ts`** and **`AUTH_PAGES`** (or equivalent) for `/reset-password`.
7. **Email / infra** — SES template `reset-password` (or agreed name), env for public web base URL used in links.

---

## 11. Out of scope

- **MFA recovery** (TOTP backup codes, SMS recovery, security keys without email).
- **Passwordless authentication** as the sole recovery path (magic link login replacing password reset product definition).
- **Account enumeration** via intentional differences in forgot response or timing (product requires non-enumerating behavior).
- **Admin or support-initiated** password resets outside the self-serve email flow.
- **Security questions** or social knowledge–based recovery.
- **Multiple concurrent reset tokens per user** as a first-class UX (architecture assumes fields on a single user document; audit-only multi-token stores are not in scope unless explicitly added later).
- **Changing email** as part of the reset form (separate change-email feature).

---

## 12. Non-functional requirements (consolidated checklist)

- **Performance:** Interactive steps feel responsive; email may be asynchronous.
- **Accessibility:** WCAG-minded patterns consistent with login/register (labels, focus, errors).
- **Platform:** Web (Next.js App Router) first; deep link is standard HTTPS URL.
- **Security:** Generic forgot messaging; hashed token at rest; expiry; no sensitive logging; password policy parity with registration.

---

*This PRD reflects the decisions in [architecture.md](./architecture.md): token storage on the user document, URL shape `/reset-password?token=`, conservative generic forgot behavior, and optional GET validation for UX.*
