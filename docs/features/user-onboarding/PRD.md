# Product Requirements Document: User Onboarding (Vassembly)

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-06-27  
**Route:** `/onboarding`  
**Stack context:** Monorepo — `domains/user`, `services/auth`, `apps/api`, `apps/web`; integrates with user registration, email verification, and AI integrations flows

---

## 1. Overview

### 1.1 Feature statement

**User Onboarding** is a mandatory post-registration gate that all new users must complete before accessing the product. It comprises two sequential steps:

1. **Verify email address** — confirmed via `verifiedAt` on the user record.
2. **Create first AI integration** — confirmed when the user has ≥1 active AI credential.

Until both steps are complete, the user is restricted to a defined allowlist of routes. All other navigation attempts redirect to `/onboarding`.

### 1.2 In-scope summary

- Onboarding hub page (`/onboarding`) showing step status and guiding the user forward.
- Email verification backend: send verification email on registration, resend endpoint, and confirmation endpoint that sets `verifiedAt`.
- Route enforcement: middleware or equivalent guard that redirects incomplete users to `/onboarding` for any route not on the allowlist.
- API enforcement mirroring the UI allowlist (incomplete users may not call protected API endpoints outside the onboarding scope).
- Admin role bypass: admin users skip onboarding entirely.
- Existing user migration: grandfathered at deploy by setting `onboarding.completedAt`.
- `returnUrl` capture before onboarding and safe redirect on completion.
- Resend verification email with rate-limiting cooldown.

### 1.3 Out of scope

- Social login / SSO verification flows — handled by separate initiative.
- Multi-step onboarding wizard beyond the two defined steps (team setup, billing, profile enrichment) — future milestone.
- Mobile-native onboarding shell (App Router web only for MVP).
- In-product tours, coach marks, or feature walkthroughs — separate onboarding experience layer.
- AI integration creation logic itself — covered by the AI Integrations feature; this PRD only specifies the post-creation redirect and completion detection.
- Per-role customization of onboarding steps — all non-admin users follow the same gate.

---

## 2. User Flows

### 2.1 New user happy path

1. User completes registration at `/register`.
2. System creates user record; sets `onboarding.startedAt`; sends verification email.
3. System redirects user to `/onboarding` (not home or `returnUrl`).
4. **Onboarding hub** displays two steps with their current status.
5. User opens their email, clicks the verification link.
6. System sets `verifiedAt`; hub updates Step 1 to complete.
7. Step 2 becomes actionable; user navigates to `/agents/ai-integrations/create`.
8. User creates their first AI integration.
9. System detects ≥1 active credential; sets `onboarding.completedAt`.
10. System redirects user to the stored `returnUrl` (if safe) or `/`.

### 2.2 Incomplete onboarding — route enforcement

1. User with incomplete onboarding navigates to any route not on the allowlist.
2. Middleware intercepts and redirects to `/onboarding`.
3. User can visit `/settings` or return to `/agents/ai-integrations/create` freely.

### 2.3 Returning incomplete user

1. Authenticated user with `onboarding.completedAt === null` opens any app URL.
2. Guard redirects to `/onboarding`.
3. Hub shows which steps are done and which remain.

### 2.4 Email verification via link

1. User clicks verification link in email (contains time-limited signed token).
2. System validates token; sets `verifiedAt`; invalidates token.
3. User is redirected to `/onboarding` where Step 1 shows as complete.

### 2.5 Post-AI-integration redirect during onboarding

1. Incomplete user creates their first AI integration at `/agents/ai-integrations/create`.
2. On success, the system redirects to `/onboarding` (not to the integrations list).
3. Hub detects ≥1 active credential; marks Step 2 complete.
4. If Step 1 was already complete, `onboarding.completedAt` is set and user is forwarded.

---

## 3. Onboarding Steps Definition

Steps are **sequential**: Step 2 is only actionable after Step 1 is complete. Both steps must be satisfied for `onboarding.completedAt` to be set.

| # | Step | Completion signal | Editable by user |
|---|------|-------------------|------------------|
| 1 | **Verify email address** | `verifiedAt != null` on user record | No; system-set on token confirmation |
| 2 | **Create first AI integration** | User has ≥1 active AI credential | No; derived from integrations state |

**Step completion is derived at runtime** — no duplicate flags in the `onboarding` object. `onboarding.emailVerified` does not exist.

---

## 4. Allowed Routes During Incomplete Onboarding

The following routes are accessible to an authenticated user with `onboarding.completedAt === null`:

| Route | Access level |
|-------|-------------|
| `/onboarding` | Full access (the hub) |
| `/settings` | Full access |
| `/agents/ai-integrations/create` | Full access |

All other routes redirect to `/onboarding`. This applies to both:
- **UI** — client-side route guard / Next.js middleware.
- **API** — server-side enforcement; requests to protected API endpoints outside this scope return `403` with a structured error indicating onboarding is incomplete.

**Admin users** are fully exempt from this gate. Admins can access all routes regardless of `onboarding.completedAt`.

---

## 5. Redirect Behavior

| Trigger | Destination |
|---------|-------------|
| Successful registration | `/onboarding` (unconditionally; `returnUrl` is captured but not followed yet) |
| Incomplete user navigates to restricted route | `/onboarding` |
| Verified email via link | `/onboarding` |
| AI integration created during onboarding | `/onboarding` |
| Onboarding completed (both steps done) | Stored `returnUrl` if safe (same-origin or allowlist), otherwise `/` |
| Admin user logs in | Normal post-login destination (onboarding gate skipped) |

**`returnUrl` safety:** Same rules as the login PRD — same-origin or explicit allowlist. Arbitrary external URLs are rejected and fall back to `/`.

---

## 6. Data Model

### 6.1 `onboarding` object on the user entity

The `onboarding` field is a nested object added to the user record in `domains/user`:

```typescript
onboarding?: {
  version: number;      // schema version for future migrations
  startedAt?: Date;     // set when the user is first redirected to /onboarding (post-registration)
  completedAt?: Date | null; // null = in progress; Date = all steps done; undefined = not started (grandfathered)
}
```

**Canonical rules:**
- `onboarding` is set on the user record by the registration handler.
- `completedAt` is `null` while any step remains incomplete.
- `completedAt` is set to the current timestamp when all steps are satisfied (after AI integration creation detection or after email verification triggers the final check).
- `completedAt` being `undefined` (field absent) indicates an existing user grandfathered by migration — treated as complete.

### 6.2 Step completion derivation (runtime, not stored)

| Step | Derived from |
|------|-------------|
| Email verified | `user.verifiedAt != null` |
| AI integration created | At least one active AI credential exists for the user |

These are never stored as flags inside `onboarding`.

### 6.3 Existing user migration

At deploy time, a one-off migration sets `onboarding.completedAt` to a past timestamp (or leaves the field absent) for all users created before this feature ships. These users are treated as having completed onboarding and see no gate.

---

## 7. Email Verification Requirements

### 7.1 Send on registration

- The registration handler sends a verification email immediately after creating the user.
- Email contains a time-limited signed token (single-use, expiry per platform security standard — recommended 24–72h).
- Token is invalidated on first use or expiry.
- `verifiedAt` remains `null` until the token is successfully confirmed.

### 7.2 Verification confirmation endpoint

- **REST** `POST /api/auth/verify-email` (or equivalent per API gateway conventions) accepts the token.
- Validates token: checks signature, expiry, and single-use state.
- On success: sets `verifiedAt` on the user record; invalidates the token; checks if onboarding is now complete.
- Redirects user to `/onboarding`.
- On failure: returns `400` with a stable error code; does not expose whether the email exists.

### 7.3 Resend verification email

- **REST** `POST /api/auth/resend-verification` (or equivalent) is available to authenticated users whose `verifiedAt` is still `null`.
- Rate-limited with a reasonable cooldown (exact threshold is an engineering decision; recommended minimum 60s between resends per account).
- On success: a new token is issued; previous tokens are invalidated; new email sent.
- On cooldown: returns `429` with a `retryAfter` value the client can surface.
- Resend is accessible from the `/onboarding` hub page.

### 7.4 Token security

- Tokens are signed (not guessable); single-use; expiry enforced server-side.
- Token values are never logged.
- Verification links use HTTPS.

---

## 8. Onboarding Hub Page (`/onboarding`)

### 8.1 Content requirements

- Heading that orients the user ("Complete your account setup" or equivalent).
- Two step cards displayed in order, each showing:
  - Step number and title.
  - Completion status (pending / done).
  - Brief description of what the step requires.
  - Primary action or status indicator.
- Step 2 is visually inactive (greyed or locked) until Step 1 is complete.

### 8.2 Step 1 — Verify email

- Shows the email address the verification was sent to.
- **Resend email** action with cooldown feedback (e.g. "Resend available in 58s").
- On Step 1 complete: card updates to "Verified" state and Step 2 becomes active.

### 8.3 Step 2 — Create AI integration

- Enabled only when Step 1 is done.
- Primary CTA: "Add AI integration" navigates to `/agents/ai-integrations/create`.
- On Step 2 complete: card updates to "Done" state and onboarding finalizes.

### 8.4 States

| State | UI behavior |
|-------|-------------|
| Step 1 pending | Step 1 card active with resend; Step 2 card locked |
| Step 1 done | Step 1 card shows "Verified"; Step 2 card unlocked |
| Step 2 done (all complete) | User is forwarded; hub is not shown |
| Resend on cooldown | Button disabled with countdown or "Try again in Xs" |

---

## 9. Use Cases (Gherkin)

### 9.1 Primary use cases

```gherkin
Scenario: New user is redirected to onboarding after registration
  Given a visitor completes registration
  When the account is created
  Then the system sets onboarding.startedAt and onboarding.completedAt to null
  And sends a verification email
  And redirects the user to "/onboarding"
```

```gherkin
Scenario: User verifies email via link
  Given an authenticated user with verifiedAt null
  And the user has received a verification email
  When the user clicks the verification link with a valid unexpired token
  Then verifiedAt is set on the user record
  And the token is invalidated
  And the user is redirected to "/onboarding"
  And Step 1 shows as complete on the hub
```

```gherkin
Scenario: User creates first AI integration and completes onboarding
  Given an authenticated user with verifiedAt set and no active AI credentials
  When the user creates an AI integration at "/agents/ai-integrations/create"
  Then onboarding.completedAt is set on the user record
  And the user is redirected to the stored returnUrl if safe, or "/"
  And all routes are now accessible
```

```gherkin
Scenario: Incomplete user is redirected from a restricted route
  Given an authenticated user with onboarding.completedAt null
  When the user navigates to any route not on the onboarding allowlist
  Then the user is redirected to "/onboarding"
```

```gherkin
Scenario: Admin user bypasses onboarding
  Given an authenticated user with the admin role
  And onboarding.completedAt is null
  When the user navigates to any route
  Then no redirect to "/onboarding" occurs
  And the user accesses the route normally
```

```gherkin
Scenario: Existing user is grandfathered at deploy
  Given a user who registered before the onboarding feature was deployed
  When a migration sets their onboarding field to indicate completion
  Then the user never sees the onboarding gate on next login
```

### 9.2 Secondary use cases

```gherkin
Scenario: Incomplete user visits /settings
  Given an authenticated user with onboarding.completedAt null
  When the user navigates to "/settings"
  Then the user accesses Settings normally
  And no redirect to "/onboarding" occurs
```

```gherkin
Scenario: User resends verification email
  Given an authenticated user with verifiedAt null
  And the resend cooldown has elapsed
  When the user activates "Resend email" on the onboarding hub
  Then a new verification email is sent
  And the previous token is invalidated
  And the user sees a success confirmation
```

```gherkin
Scenario: Completed user visits /onboarding
  Given an authenticated user with onboarding.completedAt set
  When the user navigates to "/onboarding"
  Then the user is redirected to "/" or their last destination
```

```gherkin
Scenario: returnUrl is captured pre-onboarding and honored on completion
  Given a new user registered after attempting to reach a protected route
  And the returnUrl was captured before the redirect to "/onboarding"
  When onboarding completes
  Then the user is redirected to the captured returnUrl if it is on the safe allowlist
```

---

## 10. Edge Cases & Error Handling (Gherkin)

### 10.1 Email verification edge cases

```gherkin
Scenario: Verification token is expired
  Given a user clicks a verification link
  When the token has passed its expiry time
  Then verifiedAt is not set
  And the user sees a message indicating the link has expired
  And the user is presented with an option to resend a new verification email
```

```gherkin
Scenario: Verification token is already used
  Given a user has already verified their email
  When the user or another session uses the same token again
  Then the system returns an error
  And no change is made to verifiedAt
  And no user information is leaked via distinct error messages
```

```gherkin
Scenario: Verification link for a non-existent or deleted token
  Given a malformed or unknown token is submitted
  When the verification endpoint receives the token
  Then the endpoint returns a 400 with a stable, non-enumerating error
```

### 10.2 Resend cooldown

```gherkin
Scenario: User requests resend within cooldown window
  Given the user requested a verification email less than the cooldown period ago
  When the user activates "Resend email"
  Then the API returns 429 with a retryAfter value
  And the UI shows how long until resend is available
  And no new email is sent
```

```gherkin
Scenario: Resend requested for already-verified user
  Given verifiedAt is already set on the user record
  When the resend verification endpoint is called
  Then the endpoint returns an appropriate error (e.g. 409)
  And no email is sent
```

### 10.3 Route enforcement edge cases

```gherkin
Scenario: Incomplete user calls a protected API endpoint directly
  Given an authenticated user with onboarding.completedAt null
  When the user sends a request to a protected API endpoint outside the onboarding scope
  Then the API returns 403 with a structured error indicating onboarding is incomplete
```

```gherkin
Scenario: Incomplete user navigates to /agents/ai-integrations/create directly
  Given an authenticated user with onboarding.completedAt null
  When the user navigates to "/agents/ai-integrations/create"
  Then the user accesses the page normally (it is on the allowlist)
```

```gherkin
Scenario: Step 2 accessed before Step 1 is complete
  Given an authenticated user with verifiedAt null
  When the user navigates to "/agents/ai-integrations/create"
  Then the user can access the page (route is allowed)
  But the onboarding hub Step 2 CTA is visually locked
  And a prompt indicates Step 1 must be completed first
```

### 10.4 Interrupted flows

```gherkin
Scenario: User closes verification email and returns later
  Given a user registered and received a verification email
  And the user has not verified yet
  When the user logs in again in a new session
  Then the user is redirected to "/onboarding"
  And Step 1 shows as pending with the option to resend
```

```gherkin
Scenario: Network failure when completing onboarding step
  Given the user submits an action that would complete a step
  When a network error occurs
  Then the user sees a retry-capable error message
  And onboarding.completedAt is not set prematurely
```

```gherkin
Scenario: User's session expires while on /onboarding
  Given the user is on the onboarding hub
  When the session becomes invalid
  Then the user is redirected to sign-in
  And after re-authentication the onboarding gate is re-evaluated correctly
```

### 10.5 returnUrl safety

```gherkin
Scenario: returnUrl is an external or unsafe URL
  Given a returnUrl was captured that is not on the safe allowlist
  When onboarding completes
  Then the user is redirected to "/" instead of the unsafe URL
```

### 10.6 System errors

```gherkin
Scenario: Server error when setting verifiedAt
  Given the user clicks a valid verification link
  When the server encounters an unexpected error persisting verifiedAt
  Then the user sees a generic retry message without internal error details
  And verifiedAt is not set
```

---

## 11. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Performance** | `/onboarding` hub renders within product SLO for authenticated pages; step status derived at request time without blocking additional round-trips beyond the user record fetch. |
| **Accessibility** | Full keyboard navigation on hub and step cards; step status announced via ARIA live region on completion; resend cooldown countdown accessible to screen readers. |
| **Platform** | Web (Next.js App Router); enforcement via middleware; responsive layout per design system. |
| **Security** | Verification tokens: signed, single-use, expiry ≤ 72h; never logged; HTTPS only. Resend: rate-limited per account. API enforcement: `403` for incomplete users outside allowlist. |
| **Persistence** | `verifiedAt` and `onboarding.completedAt` durable before client receives success response. |
| **Migration** | Existing users grandfathered at deploy without manual intervention; migration is idempotent and safe to re-run. |
| **Audit** | Onboarding completion and email verification events emitted as structured events (no PII in payloads) per platform standards. |

---

## 12. Acceptance Criteria (QA / Definition of Done)

### 12.1 Functional checklist

- [ ] New user registration → `onboarding.startedAt` set, `onboarding.completedAt` is `null`, user redirected to `/onboarding`.
- [ ] Verification email sent immediately on registration.
- [ ] Valid verification token → `verifiedAt` set; token invalidated; redirect to `/onboarding`.
- [ ] Expired token → `verifiedAt` not set; user sees expiry message and resend option.
- [ ] Reused token → error returned; no state change; no user enumeration.
- [ ] Resend: new email sent; previous token invalidated; cooldown enforced.
- [ ] Resend within cooldown → `429` with `retryAfter`; no email sent.
- [ ] `/onboarding` hub correctly reflects Step 1 status from `verifiedAt` and Step 2 status from active credentials count.
- [ ] Step 2 CTA on hub is disabled/locked when Step 1 is not complete.
- [ ] Incomplete user navigating to a restricted route → redirect to `/onboarding`.
- [ ] Incomplete user can access `/settings`, `/agents/ai-integrations/create`, and `/onboarding` without redirect.
- [ ] Incomplete user calling a protected API outside allowlist → `403` with onboarding-incomplete error code.
- [ ] After creating first AI integration during onboarding → redirect to `/onboarding`, not integrations list.
- [ ] After all steps complete → `onboarding.completedAt` set; user forwarded to safe `returnUrl` or `/`.
- [ ] Unsafe or external `returnUrl` rejected; user redirected to `/`.
- [ ] Admin user — no onboarding gate applied regardless of `onboarding.completedAt`.
- [ ] Existing users after migration — no onboarding gate shown; all routes accessible.
- [ ] Completed user visiting `/onboarding` → redirected to `/`.

### 12.2 UI/UX states

- [ ] Hub shows two step cards with correct pending/done states.
- [ ] Step 2 visually locked when Step 1 is pending.
- [ ] Resend button shows cooldown feedback; disabled during cooldown.
- [ ] Loading state shown during verification and resend requests.
- [ ] Error states display user-friendly messages without internal details.

### 12.3 Regression

- [ ] Login, registration, and settings flows unchanged.
- [ ] Users who completed onboarding before this feature (grandfathered) can log in and use all routes.
- [ ] AI integration creation outside of onboarding context (for completed users) redirects to integrations list as normal.

---

## 13. Dependencies

| Layer | Responsibility |
|-------|----------------|
| **`domains/user`** | `onboarding` field on user model; commands to set `startedAt`, `completedAt`, `verifiedAt`; query for onboarding status. |
| **`services/auth`** | Registration handler sets `onboarding`; sends verification email; resend handler; verify-email handler. |
| **`apps/api`** | REST routes: `POST /auth/verify-email`, `POST /auth/resend-verification`; middleware enforcing onboarding allowlist on protected endpoints. |
| **`apps/web`** | `/onboarding` page; Next.js middleware for route guard; redirect logic; resend UI with cooldown; step status derived from user data. |
| **`ui/api-hooks`** | `useResendVerification`, `useVerifyEmail` hooks; typed REST calls with error mapping. |
| **Email templates** | Verification email template (distinct from password reset). |
| **Infra** | Signed token secrets; rate limit config for resend endpoint; migration script for existing users. |

---

## 14. Related Documentation

- User Registration: `docs/features/user-registration/prd.md`
- User Login: `docs/features/user-login/prd.md`
- User Settings: `docs/features/user-settings/prd.md`
- User Account Deletion: `docs/features/user-account-deletion/prd.md`
- Agent / AI Integrations: (architecture or PRD for AI integration creation feature)
