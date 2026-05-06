# Product Requirements Document: Account Deletion (Immediate Soft-Delete)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-05-06  
**Related documentation:**
- Parent surface: [User Settings PRD](../user-settings/prd.md) — settings shell, destructive-action UX expectations, and regression scope for `/settings`.
- Technical specification: [User Settings Architecture](../user-settings/architecture.md) — **Account deletion — immediate soft-delete (May 2026)** section (supersedes legacy two-step REST + hard-delete confirm flow).

---

## 1. Project Overview & Scope

### 1.1 Feature name

**Account deletion via immediate soft-delete** (`removedAt`), initiated by the authenticated user from User Settings, with **no** server-side pending-deletion state, confirmation tokens, or confirmation email round-trip.

### 1.2 User story

As a **logged-in user**, I want to **permanently leave the product** from Settings with a **clear, deliberate confirmation**, so that **my account becomes inactive immediately**, I am **signed out**, and I can **register again later with the same email** if I choose—without relying on staff or a second confirmation channel.

### 1.3 Target audience

- All authenticated personas who have access to User Settings account deletion (aligned with [User Settings PRD](../user-settings/prd.md) role matrix).

### 1.4 In scope

- **Single-step authenticated deletion:** one backend operation sets **`removedAt`** on the existing user record (soft delete); persistence reuses established model/DAO soft-remove semantics.
- **UX-only confirmation modal** in Settings (checkbox, typed phrase, consequences copy—patterns compatible with existing settings schemas): gates intent **only** on the client; **does not** create tokens, emails, or a second confirmation endpoint.
- **REST route** exposed at **`POST /user/delete-account`** (replacing **`request-account-deletion`**); **no** **`confirm-account-deletion`** route.
- **Auth semantics:** removed accounts cannot authenticate; identity reads that represent “current user” treat removed users as absent where applicable (consistent with architecture).
- **Email reuse:** after removal, **a new registration with the same email is allowed**; at most **one active** user exists per email (see §2.3).
- **Removal of legacy flow:** discontinue two-step **`requestAccountDeletion` + `confirmAccountDeletion`**, deletion confirmation token fields on the user document, and hard-delete-on-confirm behavior—per architecture supersession note.

### 1.5 Out of scope

- **Automated PII purge / retention schedule** beyond marking `removedAt` (policy may exist separately; soft-delete retains data until purge).
- **Admin-initiated deletion** or impersonation flows.
- **GraphQL deletion mutation** unless product later mandates parity (architecture: REST-only is acceptable if unchanged).
- **Email notification** to the user that deletion completed (unless separately specified).

---

## 2. User Experience & Logic (“What”)

### 2.1 User journeys

1. User opens **Settings** → **Account deletion** section.
2. User chooses **Delete account** (or equivalent primary action).
3. **Confirmation modal** opens with destructive framing: consequences, required confirmations (e.g. checkbox + typed phrase per existing schema patterns).
4. User completes confirmations and submits **once**.
5. Client sends **one authenticated** request to **`POST /user/delete-account`** (body may be empty if identity comes only from session/token—per architecture).
6. On **success**: user sees confirmation messaging (e.g. account removed), **local authenticated session is torn down**, stored user preferences cleared per existing patterns, user routed appropriately (e.g. signed-out landing).
7. **Email reuse:** User may later **register** with the **same email**; system creates a **new** user document; prior removed row remains with historical email unless compliance dictates otherwise.

### 2.2 Functional requirements

| ID | Requirement |
|----|-------------|
| **R1** | **Immediate soft-delete:** Successful deletion sets **`removedAt`** on the user document via DAO/model soft-remove; **no** pending deletion state on the server. |
| **R2** | **Modal is UI-only:** The confirmation modal **must not** trigger a separate backend confirmation, token issuance, or email step. Submitting from the modal triggers **exactly one** deletion API call. |
| **R3** | **Authentication:** Only the **authenticated subject** may delete **their own** account; authorization follows existing self-serve user route patterns. |
| **R4** | **Route naming:** Public HTTP path **`/user/delete-account`**; legacy **`/user/request-account-deletion`** and **`/user/confirm-account-deletion`** are removed from the product surface. |
| **R5** | **Single domain command:** Orchestration collapses to **one** domain operation (illustrative name per architecture: `deleteAccount`) replacing staged request/confirm commands. |
| **R6** | **Single service handler** wrapping the domain command; remove confirm handler. |
| **R7** | **Single client hook** for deletion (illustrative: `useDeleteAccount`); remove hooks tied to request + confirm flows. |
| **R8** | **Model cleanup:** Remove **`deletionConfirmationTokenHash`** and **`deletionConfirmationExpiresAt`** from the user model and factories; new code **must not** read/write legacy keys (legacy documents may retain keys until optional cleanup). |
| **R9** | **Active-only email:** **`getByEmail`** / credential verification resolve users **only** when active (`removedAt` null/absent). |
| **R10** | **Email uniqueness among active users:** Enforce via **MongoDB partial unique index** on `email` scoped to active users (preferred). Alternative (architecture): tombstone email on delete—only if partial indexes are unavailable; product still requires successful reuse path. |
| **R11** | **Registration alignment:** Registration/pre-checks use the same **active-only** assumption as login and the index. |
| **R12** | **Repeat deletion policy:** Engineering selects **one** consistent policy when `removedAt` is already set—**idempotent success** or **consistent client-visible error**—and covers it in tests (see §6). |

### 2.3 Email reuse (core requirement detail)

- **Goal:** Only **one active** user per email at any time.
- **Removed users** must **not** block a new registration with that email.
- **Verification:** Flow **register → delete → register again with same email** succeeds; second account is a **new** document with **`removedAt` unset**.

### 2.4 Content & messaging

| Context | Copy direction |
|---------|----------------|
| Modal title/body | Clear irreversible framing; no promise of instant data purge beyond account access removal unless legal dictates otherwise. |
| Success | Example: **“Your account has been removed.”** |
| Errors | Map server/auth failures to safe, non-sensitive messages; no token or “check email to confirm deletion” wording. |

---

## 3. Use Cases (Gherkin)

### 3.1 Primary use case — successful deletion

```gherkin
Scenario: User deletes account from Settings with deliberate confirmation
  Given I am authenticated
  And I am on the User Settings account deletion experience
  When I open the delete confirmation modal
  And I satisfy all required confirmations in the modal
  And I submit the modal once
  Then the client sends a single authenticated request to delete my account
  And my account is soft-deleted with removedAt set
  And my session is torn down locally and I am treated as signed out
  And I see success messaging that my account has been removed
```

### 3.2 Secondary — email reuse after deletion

```gherkin
Scenario: Same email can register after prior account was removed
  Given an account existed with email "user@example.com"
  And that account has been removed (removedAt set)
  When I complete registration using "user@example.com"
  Then registration succeeds
  And the new user is a distinct active account without removedAt set
```

### 3.3 Secondary — removed user cannot sign in

```gherkin
Scenario: Removed user cannot authenticate
  Given my account has been removed (removedAt set)
  When I attempt to sign in with my prior credentials
  Then authentication fails with user-facing outcome consistent with invalid or unknown credentials policy
```

---

## 4. Edge Cases & Error Handling (Gherkin)

### 4.1 Validation & interrupted flows

```gherkin
Scenario: Modal blocks accidental deletion
  Given I opened the delete confirmation modal
  When I have not satisfied required confirmations
  Then the destructive submit control remains unavailable or submission is prevented
  And no delete-account API request is sent

Scenario: User dismisses modal without confirming
  Given I opened the delete confirmation modal
  When I dismiss or navigate away without submitting
  Then no delete-account API request is sent
  And my account remains active

Scenario: Loss of connectivity during deletion
  Given I submitted the modal while offline or the network fails
  When the delete-account request cannot complete successfully
  Then I see an actionable error state
  And my session is not torn down unless deletion succeeded

Scenario: Session expires before submission
  Given my session is no longer valid
  When I attempt to submit account deletion
  Then the request fails authorization
  And I am guided to sign in again rather than silently succeeding
```

### 4.2 Server-side edge cases

```gherkin
Scenario: Repeat deletion request for already removed account
  Given my account already has removedAt set
  When an authenticated delete-account request targets my user record
  Then the system responds according to the agreed repeat-deletion policy (idempotent success or consistent error)
  And behavior matches documented tests

Scenario: Authenticated subject mismatch
  Given I am authenticated as user A
  When I attempt an operation that would delete another user's account
  Then the operation is denied per self-serve authorization rules
```

### 4.3 System errors

```gherkin
Scenario: Server error during deletion
  Given I submitted a valid delete-account request
  When the server returns a server error response
  Then I see a safe generic failure message
  And no success teardown occurs unless deletion completed

Scenario: Client receives not-found for user identity reads post-deletion
  Given my account has been removed
  When the application requests current user profile using patterns that exclude removed users
  Then the experience behaves as if the user record is absent (consistent with auth/session UX)
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Deletion request should complete within typical authenticated mutation latency for the API; modal UX remains responsive during in-flight request (loading/disabled submit).

### 5.2 Accessibility (a11y)

- Confirmation modal must be keyboard-operable and screen-reader compatible (focus trap, labelled controls, destructive action naming).

### 5.3 Platform specifics

- **Web (Next.js):** Implemented within Settings surfaces documented under [User Settings PRD](../user-settings/prd.md).

### 5.4 Persistence & compliance notes

- Soft-delete **retains** data until purge policy executes elsewhere.
- Legacy MongoDB keys from the superseded flow may remain until operational cleanup; application logic ignores them.

### 5.5 Errors package alignment

- Use existing typed errors (`NotFoundError`, `UnauthorizedError`, `WrongParamError`, etc.) where appropriate—per architecture guidance.

---

## 6. Acceptance Criteria (QA / Engineering)

### 6.1 Functional checklist

- [ ] **R1–R12** satisfied as observable behavior or documented exception where noted (repeat deletion policy chosen and tested).
- [ ] Legacy routes **`request-account-deletion`** and **`confirm-account-deletion`** are **not** exposed.
- [ ] **`POST /user/delete-account`** succeeds for authenticated owner and sets **`removedAt`**.
- [ ] Confirmation modal results in **exactly one** HTTP deletion call on successful submit.
- [ ] Post-success: session teardown + preference clearing behaviors align with architecture-listed reuse (`teardownLocalAuthenticatedSession`, `clearStoredUserPreferences`).
- [ ] **Email reuse:** partial unique index (or approved alternative) + register-after-delete scenario passes automated coverage.

### 6.2 UI/UX states

- Modal: disabled/loading during request; success path messaging; error path without leaking internals.
- Settings section remains reachable only when authenticated per User Settings rules.

### 6.3 Regression check

- Settings sections unrelated to deletion behave per [User Settings PRD](../user-settings/prd.md).
- Login/register flows unaffected except improved alignment with active-only email semantics.

---

## 7. Affected Packages & Dependencies

Upstream → downstream flow (from architecture):

```text
domains/user (model, factories, commands, command tests, exports)
  ↑
services/auth (handlers, handler tests, index exports)
  ↑
apps/api (routes/index, route module(s))
  ↑
ui/api-hooks (hooks, user index, GraphQL documents if applicable)
  ↑
apps/web (SettingsAccountDeletionInteractiveBody, optional section wrapper)
```

**Representative removals/replacements (architecture):**

- Domain: `confirmAccountDeletion/**`; replace staged request implementation with single delete command.
- Service: remove `confirmAccountDeletion/**`; single delete handler.
- API: remove `confirmAccountDeletion` route module; replace request route with `delete-account`.
- Hooks: remove `useConfirmAccountDeletion` and legacy request hook; add single deletion hook.

**Optional follow-ups** (architecture): login/refresh/`getUser` hardening; `getUserQuery` if UI must reflect removed state.

**No new packages** required for this feature slice.

---

## 8. Testing Strategy

| Layer | Expectations |
|-------|----------------|
| **Domain** | Tests for single delete command: success soft-removes (`removedAt`), not found, already removed per chosen policy; remove obsolete request/confirm suites. |
| **Service** | Single handler test suite; confirm handler tests removed. |
| **API** | Authenticated delete returns agreed success shape (e.g. HTTP 200 / `{ success: true }`); confirm route absent. |
| **Web** | Component/integration test: modal confirmation leads to **one** API invocation; no token staging. |
| **Auth / registration** | `verifyCredentials` / `getByEmail`: removed users cannot authenticate; **register**: same email after deletion succeeds consistent with §2.3 (partial index + query alignment). |

---

## 9. Traceability

| PRD section | Architecture reference |
|-------------|-------------------------|
| Scope, supersession | `docs/features/user-settings/architecture.md` — **Account deletion — immediate soft-delete (May 2026)** intro & Analysis |
| Data model & email reuse | §1, §1b |
| Workflow/API | §2 |
| Frontend | §3 |
| Reuse/removal matrix | §4 |
| Packages | §5, Todo plan |
| Testing | §6 |
| Ordered implementation | § Implementation steps (engineering execution guide—detail preserved in architecture doc) |

---

**End of document**
