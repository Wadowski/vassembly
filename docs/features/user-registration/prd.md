# Product Requirements Document: User Registration (Vassembly)

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-05-04  
**Primary route (proposed):** `/register` (exact path to match routing conventions)  
**Stack context:** Monorepo — `domains/user`, `services/auth`, `apps/api`, `apps/web`, `ui/api-hooks`, reusable form components under `ui/components`; aligns with **login**, **forgot password**, and **reset password** flows

---

## 1. Overview

### 1.1 Feature statement

**User registration (sign-up)** lets a **new visitor** create an account by providing the **minimum identity and credential data** required by the product, persist a **user record** with a **secure password**, optionally complete **email verification**, and either **start an authenticated session** immediately or **land on login** per the chosen post-registration policy. The experience must fit cleanly with **login** (link from `/login`), **forgot/reset password**, and existing **user** domain fields.

### 1.2 Why this feature is needed

- **Acquisition:** Visitors who are not yet users need a self-serve path to create an account without administrator intervention.
- **Consistency:** Registration, login, and recovery share validation, messaging, and security expectations; one coherent model reduces support friction.
- **Trust:** Clear validation, error handling, and verification (when enabled) set expectations for account security and recovery.

### 1.3 In-scope summary

- Registration UI (web): fields per Section 7, client validation, loading and error states, links to login and legal/privacy entry points where the host app requires them.
- API for submitting registration: validates input, creates user with password hashing in the user domain, returns a contract aligned with Section 5.
- Integration with **auth service** for any orchestration beyond user creation (e.g. token issuance if **auto sign-in** is in scope).
- **Email verification** flow when `verifiedAt` (or equivalent) is part of the user model: send message, clickable link or code path, completion updates verification state.
- Duplicate-email and abuse-handling behavior per Section 9 and 10.
- Accessibility and non-functional expectations consistent with login.

### 1.4 Alignment with existing features

- **Login:** Register link from login lands on registration; after successful registration, user can sign in or is signed in per Section 4. `returnUrl` behavior after registration should mirror login’s **safe redirect** rules if the product navigates post-success.
- **Forgot / reset password:** New users use registration, not reset; copy and routing must not conflate the two. Reset remains for **existing** credentials recovery.
- **User domain model:** Persisted fields must remain consistent with the authoritative user schema (e.g. email, name fields, `passwordHash`, `verifiedAt`, tokens for reset/deletion as applicable — see Section 7).

---

## 2. Goals and success metrics

### 2.1 Goals (product and user outcomes)

| Goal | Description |
|------|-------------|
| **Completeness** | A visitor can create an account end-to-end on the web app without manual onboarding steps. |
| **Clarity** | Users understand field requirements, see distinguishable validation vs server errors, and know what to do next (sign in, check email, etc.). |
| **Safety** | Passwords and tokens are handled per Section 8; no sensitive data in client logs or user-visible errors. |
| **Cohesion** | Registration does not regress login, reset, or session bootstrap; API errors map to stable client copy. |

### 2.2 Success metrics (observable)

| Metric | Definition | Target direction |
|--------|------------|------------------|
| **Registration completion rate** | Successful account creations / started registration attempts (submit) | Increase; monitor drop-off by validation vs server error |
| **Time to usable account** | p50/p95 from submit to “success” state (and to first authenticated request if auto sign-in) | Lower is better within security constraints |
| **Client validation friction** | Submits blocked by client validation / total submits | Lower unnecessary errors via clear inline help |
| **Verification completion** | Verified users / registrations requiring verification | Increase when verification is required for prod policy |
| **Error taxonomy** | Share of 4xx (validation, conflict, rate limit) vs 5xx vs network on register | Minimal unexplained 5xx; stable handling of conflict/rate-limit |
| **Support-adjacent loops** | Users abandoning after “email already in use” without reaching login | Monitor; improve cross-links copy |

---

## 3. User flows (narrative)

### 3.1 Happy path — register and use the product

1. User opens **Registration** from marketing, deep link, or **Register** on login.
2. User completes required fields, confirms password, accepts any mandatory consents the host page surfaces.
3. User submits; UI shows **loading**; duplicate submit prevented.
4. Server creates user, hashes password, persists profile fields; optional verification email sent.
5. **If auto sign-in:** client receives user + tokens (or establishes session per existing auth patterns), success messaging, redirect to safe **returnUrl** or home.
6. **If login required:** success screen or toast directs user to **login** (optionally with email prefilled query param if product allows).
7. **If verification required before full access:** user sees instructions; restricted or full access per policy until `verifiedAt` is set.

### 3.2 Happy path — verify email (when in scope)

1. User receives email with time-limited link (or code entry on site).
2. User completes action; system sets verified state and confirms success.
3. User continues to intended destination or sees confirmation with **next step** (e.g. open app).

### 3.3 Edge-oriented flows (summary)

- **Duplicate email:** User is told the email cannot be used for a new account and is steered to **login** or **forgot password** (exact copy per Section 6 and security stance).
- **Weak or mismatching password:** Client blocks submit; server rejects with mappable errors if bypassed.
- **Rate limit / abuse:** User sees non-technical message and retry guidance without exposing thresholds if policy requires.
- **Offline / timeout:** Distinct from validation; retry without full page reload where possible.

---

## 4. Functional requirements

### 4.1 Form fields and client validation

- **Email:** Required; trim; RFC-practical email validation; `autocomplete="email"`.
- **Password:** Required; rules in Section 8; masked input; **no** clipboard helpers that encourage insecure patterns.
- **Confirm password:** Required; must match password before submit (or single field if product explicitly drops confirm — **not recommended** for MVP).
- **Name:** **firstName** / **lastName** (or single **displayName**) per Section 7; required/optional and max lengths as specified there; trim.
- **Submit:** Disabled or non-interactive while request in flight; prevent double submit.
- **Links:** **Sign in** (or **Back to login**) available without submitting the form.
- **Optional:** Consent checkboxes (marketing, terms) — only if legal/product mandates; must not be “dark pattern” pre-checked where policy forbids.

### 4.2 Successful registration

- Persist user with **no plaintext password** stored; password represented only as secure hash in storage.
- Response body must allow client to either **establish session** (user + `authToken` + `refreshToken` if auto sign-in matches login) or **show success without tokens** per product choice (Section 12).
- Navigate or message per Section 3; honor **safe** `returnUrl` when session is established (same rules as login PRD: same-origin or allowlist).

### 4.3 Failure and errors

- **Validation:** Field-level messages for format, length, password rules, confirm mismatch.
- **Duplicate identifier:** User-facing copy and HTTP semantics per Section 5 and 10 (enumeration stance documented).
- **Server / network:** Generic retry for 5xx; connectivity-specific copy for network failures; no stack traces or internal ids exposed.

### 4.4 Authenticated user visits registration URL

- If session already exists, **redirect** away from registration (mirror login guard behavior — e.g. home or `returnUrl`).

---

## 5. API requirements (contracts)

Logical contract only; naming and paths follow existing `apps/api` **user** route patterns (e.g. `POST` under `/user/...`).

### 5.1 Request (registration)

| Field | Type | Rules |
|-------|------|--------|
| `email` | string | Required; normalized trim; format validated |
| `password` | string | Required; satisfies policy in Section 8 |
| `firstName` / `lastName` (or `displayName`) | string(s) | Per Section 7 |
| Optional: `returnUrl` | string | If supported, only echoed or used server-side for email templates — must not be trusted for open redirects in emails |

### 5.2 Success response

- **Public user** object (id, email, name fields as for login — **never** password hash or internal secrets).
- **If auto sign-in:** include `authToken` and `refreshToken` consistent with login success response shape.
- **If verification email sent:** optional flag `verificationEmailSent: true` for client analytics/copy (no PII in flag alone).

### 5.3 Error responses

| Situation | Status (illustrative) | Client must map to copy |
|-----------|------------------------|--------------------------|
| Body validation failed | 400 | Field-level or form message |
| Email already registered | 409 (or 400 with stable error code) | Duplicate / sign-in steer |
| Rate limited | 429 | Calm retry message |
| Server error | 5xx | Generic retry |

**Enumeration stance:** Product chooses either **explicit** “email already registered” or **generic** message; security team approval required for explicit messaging. Document the choice in acceptance criteria.

### 5.4 Email verification endpoint (if applicable)

- **Request:** token (query or body) or code + email; one-time use; expiry enforced.
- **Success:** 200; verification state updated; optional session issuance if product logs user in on verify.
- **Failure:** 400/404 with safe copy; no user enumeration via distinct messages if policy matches login.

---

## 6. UI/UX requirements

### 6.1 Layout and content

- Page title and primary heading clarify **Create account** (or equivalent).
- Required field indicators and inline errors **on blur** and **on submit**.
- Password field exposes **visibility toggle** if design system supports it on login/register.
- Link to **Sign in** for existing users.

### 6.2 Copy (minimum set — finalize with UX/legal)

| Context | Requirement |
|---------|-------------|
| Submit button | Active label vs loading label (e.g. “Creating account…”) |
| Success | Confirms account created; next step (sign in / check email / continue) |
| Duplicate email | Clear next action (login, forgot password) per policy |
| Rate limit | Retry later; no numeric limits if policy says so |
| Network | Distinct from wrong-field errors |

### 6.3 States (QA-visible)

- **Idle:** Editable fields, submit enabled when valid.
- **Loading:** Submit busy/disabled; no second POST.
- **Success:** Snackbar/banner + navigation or static success panel.
- **Error:** Snackbar and/or field errors; focus management for first invalid field.

### 6.4 Accessibility

- Keyboard operable; labels tied to inputs; errors announced compatibly with login form patterns; loading state exposed to assistive tech.

---

## 7. Data model (capture at registration)

Align with **`UserModel`** and persistence in **`domains/user`** (authoritative schema in code). Registration **captures** at minimum:

| Field | Required at sign-up | Notes |
|-------|---------------------|--------|
| `email` | Yes | Unique per product rules; normalized storage |
| `password` → `passwordHash` | Yes | Only hash persisted |
| `firstName`, `lastName` | Per product (recommend Yes for manufacturing/audit contexts) | Or single display name if model extended later |
| `verifiedAt` | N/A at submit | Set on successful verification; `null` until then |
| `id` / timestamps | System | Per `@vassembly/model` / DAO conventions |

**Do not** persist: plaintext password, verification tokens in clear text, reset tokens in user-facing responses.

Optional future fields ( **out of scope** unless added by separate PRD): phone, company, role assignment — registration MVP should not imply backend capabilities that do not exist.

---

## 8. Security and compliance

| Area | Requirement |
|------|-------------|
| **Password composition** | Minimum length **at least 8**; require mix of character classes **or** use a strength meter with minimum entropy — **exact rule** must match reset-password PRD/policy so login/reset/register agree. |
| **Password storage** | Strong adaptive hashing; per-password salt; compare with constant-time primitives where applicable. |
| **Transport** | TLS for all registration and verification calls. |
| **Logging** | Never log passwords, raw verification tokens, or reset tokens. |
| **Input** | Server validates all fields; reject oversize payloads; sanitize for storage/display contexts. |
| **Enumeration** | Document chosen stance for duplicate email and verification errors (Section 5). |
| **Rate limiting** | Registration and verification endpoints SHOULD be rate-limited; align with login abuse posture. |
| **Verification tokens** | Single-use, expiry bounded (e.g. 24–72h product default); invalidate on use. |
| **Emails** | Verification and notification emails must not embed secrets beyond opaque signed tokens; links use HTTPS. |
| **Privacy** | Collect only fields in Section 7; consent copy tied to actual data use (host app / legal). |

---

## 9. Integration points

| Layer | Responsibility |
|-------|----------------|
| **`apps/web`** | `/register` route; hosts registration form; guards for already-authenticated users; optional `returnUrl` handling after success. |
| **`ui/components`** | Reusable registration form / hooks mirroring login-form patterns (validation, completion effects). |
| **`ui/api-hooks`** | `useRegister` (or equivalent): typed POST, error mapping. |
| **`apps/api`** | Route: validate body; delegate to auth service handler(s). |
| **`services/auth`** | Handler: orchestrate **user creation** (and token issuance if auto sign-in); send verification email via mail subsystem if applicable. |
| **`domains/user`** | Command(s) for create user with hashed password; queries for uniqueness checks by email; optional commands for mark verified. |
| **Mail / notifications** | Same channel patterns as forgot/reset password email sending (templates distinct per event). |

---

## 10. Edge cases and error handling (Gherkin)

### 10.1 Primary and secondary use cases

```gherkin
Scenario: Visitor creates an account with valid data
  Given the visitor is on the registration page
  And the email is not already registered
  When the visitor enters valid required fields and matching passwords and submits
  Then the system persists a new user with a password hash
  And the visitor sees a success state
  And the visitor either has an authenticated session or is directed to sign in per product policy

Scenario: Visitor opens registration from login
  Given the visitor is on the login page
  When the visitor activates "Register"
  Then the visitor is taken to the registration flow

Scenario: Visitor completes registration with safe return URL and auto sign-in
  Given the visitor opens registration with a safe returnUrl query parameter
  When registration succeeds and auto sign-in is enabled
  Then the visitor is navigated to the allowlisted path

Scenario: Email verification link is valid
  Given a verification email was sent for the new account
  When the visitor uses a valid unexpired verification token
  Then the account is marked verified
  And the visitor sees confirmation without leaking other users' data
```

### 10.2 Validation and duplicates

```gherkin
Scenario: Client blocks invalid email
  Given the visitor is on the registration page
  When the visitor enters a malformed email and submits
  Then the registration API is not called
  And the visitor sees an email validation message

Scenario: Password and confirmation mismatch
  Given the visitor is on the registration page
  When the confirmation password does not match the password
  Then the visitor cannot successfully submit or the client shows a mismatch error
  And no user is created

Scenario: Password fails policy
  Given the visitor is on the registration page
  When the password does not meet the configured policy
  Then the visitor sees policy guidance
  And the server rejects weak passwords if sent

Scenario: Duplicate email
  Given an account already exists for the email
  When the visitor submits registration with that email
  Then the visitor sees duplicate-email handling per product policy
  And the visitor can navigate toward login or password recovery

Scenario: Ambiguous duplicate messaging when enumeration mitigation is required
  Given the product uses non-enumerating duplicate handling
  When the visitor submits an email that may already exist
  Then the visitor sees messaging consistent with the approved security policy
```

### 10.3 Interrupted flows and abuse

```gherkin
Scenario: Network failure on submit
  Given the visitor is on the registration page
  When the registration request fails due to connectivity
  Then the visitor sees a connectivity-oriented message
  And the visitor can retry

Scenario: Double submit while loading
  Given a registration request is in progress
  When the visitor attempts to submit again
  Then a second registration request is not issued

Scenario: Rate limiting
  Given the registration endpoint applies rate limiting
  When the visitor exceeds the policy threshold
  Then the visitor sees a rate-limit appropriate message
  And the message does not disclose sensitive implementation details

Scenario: Authenticated user visits registration URL
  Given the visitor already has an authenticated session
  When the visitor navigates to the registration page
  Then the visitor is redirected per session guard rules

Scenario: Expired or reused verification token
  Given the verification token is expired or already used
  When the visitor attempts verification
  Then the verification is not applied
  And the visitor sees safe guidance to request a new email if the product supports resend
```

### 10.4 System errors

```gherkin
Scenario: Unexpected server error
  Given the visitor submitted valid registration data
  When the server returns an unexpected error
  Then the visitor sees a generic retry message
  And no internal error details are shown
```

---

## 11. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Registration API p95 within product SLO for auth-related endpoints; UI loading state visible immediately on submit. |
| **Accessibility** | Same baseline as login PRD: keyboard, labels, errors, busy states. |
| **Platform** | Web (Next.js app routes); responsive layout per design system. |
| **Persistence** | New user durable in primary store before success response; verification state eventually consistent only if explicitly designed (default: strong consistency before “verified” success). |
| **Audit** | If org requires audit logs for user creation, emit events without PII in log payloads (engineering implements per platform standards). |

---

## 12. Acceptance criteria (QA / definition of done)

### 12.1 Functional checklist

- [ ] Valid data → user row created; `passwordHash` set; **no** plaintext password stored or returned.
- [ ] Invalid email / missing required fields → client blocks or server 400 with mappable errors.
- [ ] Password policy failures caught client- and server-side.
- [ ] Confirm password mismatch → no create.
- [ ] Duplicate email → documented policy behavior (explicit vs non-enumerating).
- [ ] Auto sign-in path (if in scope) returns same token shape as login; session works for a protected route smoke test.
- [ ] Non-auto-sign-in path shows correct success and login navigation.
- [ ] Verification email sent when feature enabled; token flow works until expiry; verified flag/state updated.
- [ ] Authenticated user cannot remain on registration (redirect).
- [ ] Safe `returnUrl` honored when session established; unsafe URL rejected to fallback.
- [ ] Rate limit returns stable client copy (if enabled).

### 12.2 UI/UX states

- [ ] Loading: no duplicate POST; button busy.
- [ ] Success: clear next step.
- [ ] Errors: no stack traces; field errors where applicable.

### 12.3 Regression

- [ ] Login, forgot password, reset password unchanged except intended cross-links.
- [ ] Existing users can still log in; session refresh unaffected.
- [ ] User settings and profile reads reflect new fields after registration.

### 12.4 Open product decisions (must be resolved before release)

Document the chosen behavior in this section when decided:

1. **Auto sign-in after registration:** yes/no.  
2. **Email verification:** required for login vs optional with in-app reminder vs phase-2.  
3. **Duplicate email messaging:** explicit vs non-enumerating.  
4. **Exact password rules:** single source of truth with reset-password PRD.

---

## 13. Dependencies

| Dependency | Update needed |
|------------|----------------|
| **`domains/user`** | Command to create user with hashed password; uniqueness constraint or query for email; optional command for verification completion. |
| **`services/auth`** | Register handler; optional token issuance; mail integration for verification. |
| **`apps/api`** | New route wired to handler; validation middleware. |
| **`ui/api-hooks`** | Register hook and types. |
| **`apps/web`** | Register page, routing, guards, links from login. |
| **`ui/components`** | Registration form package or extension of patterns used by login-form. |
| **Email templates** | Verification (distinct from password reset). |
| **Infra** | Rate limits, TLS, secrets for signing verification tokens (if not already shared with reset flow). |

---

## 14. Out of scope

- **Social login / SSO** (OAuth, SAML, enterprise IdP) — separate initiative unless added later.
- **Admin-provisioned accounts only** replacing self-serve registration — not part of this PRD.
- **Invited-only registration** (invite tokens, org join) — separate PRD unless merged explicitly.
- **CAPTCHA / bot UX** — may be layered at edge; not required in form MVP unless security mandates.
- **Phone / SMS verification** — not required unless specified later.
- **Profile photo, organization picker, role self-selection** — not required for MVP unless backend exists.
- **International phone formats, full i18n audit** — follow global product roadmap; English (or current app default) baseline only unless stated.
- **Implementation details** of DB indexes, token algorithms, exact email provider — architecture docs.

---

## 15. Related documentation

- Login: `docs/features/login/prd.md`
- Password reset: `docs/features/reset-password/architecture.md` (and any forgot/reset PRD)
- User settings: `docs/features/user-settings/prd.md`
