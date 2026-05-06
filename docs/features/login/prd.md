# Product Requirements Document: Login (Vassembly)

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-05-04  
**Primary route:** `/login`  
**Stack context:** Monorepo — `domains/user`, `services/auth`, `apps/api`, `ui/api-hooks`, `ui/components/login-form`, `apps/web`; JWT-style auth and refresh tokens composed in the auth service

---

## 1. Overview & goals

### 1.1 Feature statement

The **login** feature lets an existing user sign in with **email and password**, receive a **session** backed by **auth and refresh tokens**, and reach the intended in-app destination (including deep links via `returnUrl`). It must work coherently with **registration**, **forgot password**, **reset password**, and **post-login auth refresh** flows already present or in flight in the codebase.

### 1.2 Why this matters

- **Access:** Login is the primary gate for authenticated experiences (e.g. settings, role-appropriate UI).
- **Trust:** Predictable success, failure, and recovery paths reduce support load and abandonment.
- **Continuity:** Correct handling of `returnUrl` and session establishment avoids “logged in but stuck” states.

### 1.3 In-scope summary

- Email/password sign-in UI and client validation.
- API contract for submitting credentials and returning user + tokens.
- Server-side verification via the user domain, token issuance via auth-token and refresh-token domains (orchestrated by the auth service).
- Client session update and navigation after success.
- Clear, safe error messaging for validation, auth failure, and connectivity issues.
- Entry points from **Forgot password?** and **Register** on the login screen.

---

## 2. User stories

| ID | As a… | I want to… | So that… |
|----|--------|------------|----------|
| L-1 | Visitor with an account | Sign in with my email and password | I can use the product |
| L-2 | User who mistyped credentials | See a clear error without learning whether my email exists | My privacy is protected and I know what to try next |
| L-3 | User coming from a bookmark or email link | Land on `/login?returnUrl=…` and, after sign-in, go to that safe internal path | I don’t lose context |
| L-4 | Already signed-in user | Hitting `/login` redirect me away | I don’t see a redundant sign-in screen |
| L-5 | User who forgot my password | Open forgot password from the login form | I can recover access without hunting for the URL |
| L-6 | New user | Jump to registration from login | I can create an account |
| L-7 | User on a slow or flaky network | See timeout / connectivity messaging | I understand it’s not necessarily a wrong password |

*Note:* An explicit **“Remember me”** checkbox is **not** required in this PRD; persist-until-logout behavior is covered under assumptions and session storage (see Section 8).

---

## 3. Functional requirements

### 3.1 Form fields and validation (client)

- **Email:** Required; must pass email format validation after trim; `autoComplete="email"` (or equivalent).
- **Password:** Required; non-empty after trim (strength rules are registration/reset concern unless product extends them here).
- **Submit:** Disabled or non-interactive while a login request is in progress; prevent double submit.
- **Navigation links:** “Forgot password?” and “Register” available without submitting the form.

### 3.2 Successful login

- On **valid credentials**, the system returns a **public user** payload (id, email, name fields as contract allows) and **auth** + **refresh** tokens.
- The client **updates authenticated session state** (user + authenticated status) and persists tokens per platform rules (see assumptions).
- Show transient **success confirmation** (e.g. snackbar) and **navigate** to:
  - `returnUrl` if present and **allowed** for post-login redirect (same-origin / allowlist rules — see edge cases), else
  - a configured **fallback** path (e.g. app home).

### 3.3 Failed login and errors

- **Invalid credentials** (wrong password, unknown email, or user without password hash): user sees a **single** outcome message that does **not** distinguish “unknown email” vs “wrong password” (aligns with generic sign-in failure copy).
- **Validation errors:** show first relevant field-level or form message (email required, invalid email, password required).
- **Network / timeout:** dedicated copy; no implication that credentials are wrong.
- **Unexpected server errors:** generic retry message; no sensitive detail.

### 3.4 Cross-feature integration

- **Forgot password:** From login, user can navigate to the forgot-password experience; after reset, user can return to login and sign in with the new password (reset flow is owned by the password-reset PRD/architecture).
- **Registration:** From login, user can open registration; after account creation, user may sign in (registration PRD owns account creation specifics).
- **Post-login API usage:** Subsequent requests use issued tokens per existing HTTP/auth conventions (headers, cookies if applicable).

### 3.5 Accessibility and loading UI

- Submit control exposes **busy** state for assistive tech during loading.
- Title/heading association for the form (e.g. `aria`-related patterns) where the host page provides a title id.

---

## 4. Technical requirements (integration surfaces)

These describe **what** must connect; implementation choices remain with engineering/architecture.

| Layer | Responsibility |
|-------|----------------|
| **`apps/web`** | `/login` page: hosts `LoginForm`; reads `returnUrl`; on success, persists tokens and wires navigation; wraps with route guards so authenticated users do not stay on login. |
| **`ui/components/login-form`** | Presentational form + hooks: validation, submit orchestration, completion side effects (session, redirect, messaging). |
| **`ui/api-hooks`** | `useLogin` (or equivalent): `POST` to the login API path with `{ email, password }`; typed response for user + tokens. |
| **`apps/api`** | Route under user prefix (e.g. `POST /user/login`): validate body shape; delegate to auth service handler. |
| **`services/auth`** | Login handler: call **`domains/user`** credential verification; on success, create refresh token and auth token via respective domains; return user + tokens. |
| **`domains/user`** | **`verifyCredentials`** (or equivalent query): load user by email, compare password hash securely, strip secrets before return; throw/return contract errors for invalid cases. |
| **`domains/auth-token` / `domains/refresh-token`** | Token create (and later refresh) support session continuity after login. |
| **`ui/user-auth`** | Session provider: set authenticated user after login for the rest of the app. |

### 4.1 API contract (logical)

- **Request:** `POST` login endpoint; body: `email` (string), `password` (string).
- **Success response:** user object (no password hash), `authToken`, `refreshToken`.
- **Error responses:** Appropriate status and error types for unauthorized vs server errors; must be mappable to UX copy in Section 3.3.

---

## 5. Security considerations

| Area | Requirement |
|------|-------------|
| **Password handling** | Passwords only in transit to login endpoint over TLS; never logged; compared using secure hashing utilities in the user domain; plaintext passwords not stored. |
| **Enumeration** | Do not leak whether an email is registered via different messages or timing in the product UX (acknowledge best-effort on client; server remains authoritative). |
| **Tokens** | Auth and refresh tokens issued only after successful verification; transmitted/stored per platform threat model (see assumptions). |
| **Session fixation** | New session tokens issued at login (fresh token pair), not reuse of pre-login anonymous tokens. |
| **Redirect / open redirects** | `returnUrl` must be validated (same origin or explicit allowlist) before navigation. |
| **Rate limiting & abuse** | Login endpoint SHOULD be protected against brute force and credential stuffing (policy and thresholds to be defined with platform/SRE); document behavior when limited (user-facing message without revealing limits if policy requires). |
| **CSRF / cookies** | If auth cookie is set from client, follow `SameSite` and path policies consistent with the rest of the app. |

---

## 6. Success metrics

| Metric | Definition | Target direction |
|--------|------------|------------------|
| **Login success rate** | Successful logins / attempts where credentials were submitted | Increase |
| **Time to interactive session** | p50/p95 time from submit to authenticated landing | Lower is better |
| **Validation bounce** | Submits blocked by client validation / total submits | Lower unnecessary errors (copy/UX clarity) |
| **Recovery usage** | Clicks on “Forgot password?” from login / login sessions | Baseline + monitor for regressions after auth changes |
| **Error taxonomy** | Share of 401 vs 5xx vs network errors on login | Fewer unexplained 5xx; stable 401 handling |
| **ReturnUrl success** | Navigations after login reach intended safe destination | Near 100% for valid `returnUrl` |

---

## 7. Out of scope

- **Social / SSO login** (OAuth, SAML, magic links) unless added by a separate initiative.
- **Explicit “Remember me” checkbox** and differential storage duration (current product may persist tokens until logout — see assumptions).
- **Multi-factor authentication (MFA)** at login.
- **Account lockout policy** specifics (may be added in security policy work; login PRD only requires consistent UX when lockout exists).
- **Captcha / bot mitigation** UX (may be layered at gateway; not prescribed in UI here).
- **Implementation details** of token algorithms, key rotation, and DB schema (see architecture docs).

---

## 8. Assumptions

- **User accounts** can be created via registration; users may reset passwords via forgot/reset flows; login applies to accounts with a verifiable password credential.
- **Auth service** remains the single orchestration point for login, composing user verification and token domains.
- **Web app** persists tokens after login (e.g. browser storage and optional cookie for server-aware routes) per existing `SessionBootstrap` / session helpers — sessions persist across browser restarts until cleared or logout unless product changes.
- **API base URL and CORS** are configured so the web app can call `/user/login` and related auth routes.
- **Role** and claims needed after login are available from token/session flow already used by `auth` refresh handler where applicable.

---

## 9. Use cases (Gherkin)

### 9.1 Primary use case

```gherkin
Scenario: User signs in with valid credentials
  Given the user is on the login page
  And the user has a registered account with a known email and password
  When the user enters a valid email and password and submits the form
  Then the system authenticates the user
  And the client establishes an authenticated session with returned tokens
  And the user sees a success indication
  And the user is navigated to the post-login destination
```

### 9.2 Secondary use cases

```gherkin
Scenario: User opens forgot password from login
  Given the user is on the login page
  When the user activates "Forgot password?"
  Then the user is taken to the forgot-password flow

Scenario: User opens registration from login
  Given the user is on the login page
  When the user activates "Register"
  Then the user is taken to the registration flow

Scenario: Authenticated user visits login URL
  Given the user already has an authenticated session
  When the user navigates to the login page
  Then the user is redirected away from the login page without signing in again

Scenario: User completes login with return URL
  Given the user opens the login page with a safe returnUrl query parameter
  When the user signs in successfully
  Then the user is navigated to the path described by returnUrl
```

---

## 10. Edge cases & error handling (Gherkin)

```gherkin
Scenario: Client validation blocks empty submit
  Given the user is on the login page
  When the user submits with an empty email or empty password
  Then the login API is not called
  And the user sees a validation message

Scenario: Invalid credentials
  Given the user is on the login page
  When the user submits credentials that do not match a valid account
  Then the user sees a generic sign-in failure message
  And the message does not state whether the email is unknown

Scenario: Network failure
  Given the user is on the login page
  When the login request fails due to connectivity
  Then the user sees a connectivity-oriented message
  And the user can retry without reloading the page

Scenario: Request timeout
  Given the user is on the login page
  When the login request times out
  Then the user sees a timeout message

Scenario: Malicious or disallowed returnUrl
  Given the user opens the login page with a returnUrl that is not same-origin or allowlisted
  When the user signs in successfully
  Then the user is navigated to the fallback path instead of the malicious target

Scenario: Double submit while loading
  Given a login request is in progress
  When the user attempts to submit again
  Then a second login request is not issued

Scenario: User without password (e.g. incomplete account)
  Given a user record cannot authenticate with password
  When the user attempts to sign in with email and password
  Then the outcome matches invalid credentials messaging for the end user
```

---

## 11. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Login API p95 within product SLO for auth endpoints; UI shows loading state within one frame of submit. |
| **Accessibility** | Keyboard-operable form; labels; error and success announcements consumable by screen readers where patterns exist in the design system. |
| **Platform** | Web: Next.js app route patterns, `Suspense` where search params require it. |
| **Persistence** | Tokens and session survive per Section 8; logout clears session (owned by auth/session docs). |

---

## 12. Acceptance criteria (QA checklist)

**Functional**

- [ ] Valid credentials → 200 (or success), user + both tokens returned; session populated; redirect correct.
- [ ] Wrong password → user-facing generic sign-in failure; no password hash in any response.
- [ ] Unknown email → same generic sign-in failure as wrong password (client copy).
- [ ] Client validation errors for empty/invalid email and empty password.
- [ ] `returnUrl` honored only when safe; otherwise fallback.
- [ ] Authenticated visit to `/login` redirects per guard rules.
- [ ] Links to forgot password and register work.

**UI/UX states**

- [ ] Loading: submit disabled/busy, no duplicate requests.
- [ ] Success: snackbar (or equivalent), then navigation.
- [ ] Error: snackbar/message without raw stack traces.

**Regression**

- [ ] Registration and forgot/reset password flows unchanged except intended links.
- [ ] Auth middleware / session bootstrap still recognizes tokens after login.
- [ ] Existing `POST /auth` (token refresh) behavior unchanged for unrelated scenarios.

---

## 13. Related documentation

- Password reset: `docs/features/reset-password/architecture.md` (and any published PRD for reset/forgot).
- User settings (session context): `docs/features/user-settings/prd.md`.
