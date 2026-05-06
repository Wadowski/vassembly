# Product Requirements Document: User Settings (Vassembly)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-05-02  
**Route (MVP):** `/settings`  
**Stack context:** Next.js 16 App Router; JWT auth with role string; local-first preferences (no backend sync in MVP)

---

## 1. Overview & Goals

### 1.1 Feature statement

Deliver a **logged-in-only User Settings** experience reachable from app navigation (drawer), where manufacturing users **view and edit their own** preferences and account-related actions. **Profile and security changes** that require the backend integrate with existing auth APIs where applicable; **notification UI preferences, and privacy/telemetry toggles** persist **locally on the device** for MVP (honest behavior, no stubbed controls).

### 1.2 Success criteria (from business analysis)

- Users can complete **profile viewing/editing**, **password/security** updates (where applicable), **notification and privacy** preferences, and **sign-out** without an administrator acting on their behalf. **Account deletion** is handled via a **separate feature** (see [Account Deletion PRD](../account-deletion/prd.md)).
- Settings reflect **readability** and **shared-device** realities (clear labeling, destructive confirmations, local scope obvious where relevant).
- **Role-appropriate** exposure: workers see a **subset** of notification options; supervisors see **full** notification options; other roles see defined visibility per matrix (Section 4).
- **No false controls:** every toggle or field either affects real behavior or is hidden/disabled with explanation until supported.

### 1.3 Non-goals / out of scope (MVP)

- **Server-side sync** of notification UX preferences, or privacy toggles.
- **Admin override** of another user’s settings.
- **Multi-profile** or **fast user switching** on one device.
- **Deep notification routing** (email/SMS/push) unless backend contracts exist—MVP may limit to **in-app categories** and honest channel availability.

---

## 2. User Personas & Use Cases

### 2.1 Personas

| Persona | Primary context | Settings focus |
|--------|------------------|----------------|
| **Worker** | Floor, shared tablet, gloves, variable lighting | Readability, quick sign-out, fewer notification knobs |
| **Supervisor** | Oversight, coordination | Full notification control, same core prefs as worker otherwise |
| **Planner** | Scheduling, systems | Profile, consistency with floor apps |
| **Quality** | Compliance, audits | Privacy clarity, audit-relevant identity display |
| **Maintenance** | Field, interruptions | Practical alerts subset (align with operational unless specified) |
| **Admin** | System access | Same self-serve settings as others; **no** elevated settings editing for other users in MVP |

### 2.2 Pain points addressed

- **Shared devices:** clear **sign out**, local vs account scope, destructive confirmations.
- **Trust:** privacy/telemetry labels match **actual** collection behavior.

### 2.3 Primary use cases by persona (narrative)

- **Worker:** Open Settings from drawer → adjust allowed notification categories → sign out at end of shift.
- **Supervisor:** Same as worker → additionally configure **full** notification category set → review privacy/telemetry.
- **Planner / Quality / Maintenance / Admin:** Same **matrix-driven** visibility as in Section 4; **password/security** available per auth model. **Account deletion** is handled via a **separate feature** (see [Account Deletion PRD](../account-deletion/prd.md)).

---

## 3. Feature Specifications

### 3.1 Global rules

- Only **authenticated** users access `/settings`.
- Users may **only** edit **own** profile/settings; no cross-user admin edit in MVP.
- **Local-first** keys must not overwrite server-backed identity fields on the client alone; server responses win for profile source of truth after save/refetch.

### 3.2 Settings sections

#### A. Profile (view/edit)

| Element | Editable | Validation | Role visibility | Storage |
|--------|----------|------------|-----------------|---------|
| Display name | Yes | Required if shown; max length TBD (recommend 1–80 chars); trim whitespace | All roles | Backend (source of truth) |
| Email / identifier | View; edit only if product supports change | Email format if editable | All roles | Backend |
| Role | View only in MVP | — | All roles | Backend (JWT/claims) |
| Avatar / photo | Optional future; if absent, omit section | — | All roles | Out of MVP unless already in API |

#### B. Password / security

| Element | Editable | Validation | Role visibility | Storage |
|--------|----------|------------|-----------------|---------|
| Change password | Yes, if password auth enabled | Current password, new password policy (min length, complexity per policy), confirmation match | All roles | Backend |
| Session / sign-out elsewhere | MVP: **sign out current device only** unless API exists | — | All roles | Client session clear + server invalidate if supported |
| MFA | Show **read-only** status or hide if not applicable | — | All roles | Backend / IdP |

#### C. Notifications

| Element | Worker | Supervisor | Planner | Quality | Maintenance | Admin | Storage (MVP) |
|--------|--------|------------|---------|---------|-------------|-------|----------------|
| **Master enable** (in-app notifications) | Yes | Yes | Yes | Yes | Yes | Yes | Local |
| **Categories** (see Section 8) | **Subset** | **Full** | Full | Full | Full (or align with Supervisor—decide) | Full | Local |
| Channel toggles (email/push/SMS) | Only if product **honestly** supports | Same | Same | Same | Same | Same | Local + backend when channel exists |

**Subset vs full (definition for engineering handoff):**

- **Worker subset:** operational/task assignments, safety/critical alerts, shift handover—**exclude** team/management digests unless product defines otherwise.
- **Supervisor full:** subset **plus** team escalations, coverage gaps, approval queues (only categories that exist in the product).

#### D. Privacy / telemetry

| Element | Behavior | Role visibility | Storage (MVP) |
|--------|----------|-----------------|----------------|
| Analytics / usage diagnostics | Toggle only if app has corresponding hook; label must match behavior | All roles | Local preference + app must respect |
| Marketing / optional communications | Only if applicable to B2B product; else hide | All roles | Local / backend per product |

#### G. Account deletion

| Element | Detail | Role visibility | Storage |
|--------|--------|-----------------|---------|
| Request / execute deletion | Per policy (Section 10) | All roles | Backend + local cleanup |

### 3.3 Role-based visibility matrix (show / hide)

**Legend:** Show = section or capability visible; Hide = not shown or redirected to explanation.

| Section / capability | Worker | Supervisor | Planner | Quality | Maintenance | Admin |
|---------------------|--------|------------|---------|---------|-------------|-------|
| Profile (view/edit) | Show | Show | Show | Show | Show | Show |
| Password / security | Show | Show | Show | Show | Show | Show |
| Notifications | Show (subset) | Show (full) | Show (full) | Show (full) | Show (full)* | Show (full) |
| Privacy / telemetry | Show | Show | Show | Show | Show | Show |
| Account deletion | Show | Show | Show | Show | Show | Show |
| Sign out | Show | Show | Show | Show | Show | Show |

\*Maintenance: treat as **full** unless product differentiates; if differentiated, match **Worker subset**—record decision in Open Questions.

---

## 4. Use Cases (Gherkin)

### 4.1 Primary use cases

```gherkin
Scenario: Authenticated user opens Settings from the drawer
  Given the user is logged in
  When the user opens the main navigation drawer and selects Settings
  Then the user is navigated to "/settings"
  And the user sees grouped settings sections per product layout
```

```gherkin
Scenario: Unauthenticated user cannot open Settings
  Given the user is not logged in
  When the user navigates to "/settings"
  Then the user is redirected to the sign-in experience
  And no settings content is shown
```

```gherkin
Scenario: Worker sees notification subset only
  Given the user has the "worker" role
  When the user opens the Notifications section
  Then only worker-eligible notification categories are visible
  And supervisor-only categories are not shown
```

```gherkin
Scenario: Supervisor sees full notification categories
  Given the user has the "supervisor" role
  When the user opens the Notifications section
  Then all product-defined notification categories are visible
```

```gherkin
Scenario: User updates profile successfully
  Given the user is on the Profile section
  And the user has valid editable profile fields
  When the user edits allowed fields and saves
  Then the client validates input
  And the server persists changes for server-backed fields
  And the user sees successful save feedback
```

```gherkin
Scenario: User signs out from Settings
  Given the user is on Settings
  When the user chooses Sign out and confirms if prompted
  Then the session ends
  And local session data is cleared per security policy
  And the user is returned to the unauthenticated entry state
```

### 4.2 Secondary use cases

```gherkin
Scenario: User changes password successfully
  Given password authentication is enabled for the account
  And the user is on Password / security
  When the user enters current password and valid new password twice
  And the user submits the change
  Then the password is updated server-side
  And the user receives confirmation
```

```gherkin
Scenario: User opens Password section with SSO-only account
  Given the account is managed by SSO and password change is unavailable
  When the user opens Password / security
  Then password change controls are hidden or disabled with explanatory copy
```

---

## 5. Edge Cases & Error Handling (Gherkin)

```gherkin
Scenario: Save profile while offline
  Given the device has no connectivity
  When the user attempts to save profile or password
  Then the user sees a clear error and retry guidance
  And no partial state claims success
```

```gherkin
Scenario: Session expires while editing Settings
  Given the user is editing Settings
  When the session becomes invalid
  Then the user is prompted to sign in again
  And unsaved server-backed changes are not falsely confirmed as saved
```

```gherkin
Scenario: Validation failure on profile fields
  Given the user submits invalid profile data
  When the client or server rejects the input
  Then inline errors identify the fields
  And focus moves to the first invalid field where appropriate
```

```gherkin
Scenario: User attempts account deletion without meeting confirmation requirements
  Given the user starts account deletion
  When the user fails confirmation (e.g. wrong phrase or missing checkbox)
  Then deletion does not proceed
  And the user can cancel safely
```

```gherkin
Scenario: Local storage unavailable or quota exceeded
  Given the browser blocks or quota-exceeds local preference storage
  When the user changes a local-only preference
  Then the user sees a non-technical warning
  And the app does not claim persistence
```

```gherkin
Scenario: Worker navigates directly to a hidden notification category via URL
  Given a deep link or stale URL targets a supervisor-only control
  When the worker opens it
  Then access is denied or the control is hidden
  And an appropriate empty or permission message is shown if the route exists
```

```gherkin
Scenario: Server error on save
  Given the user submits a valid profile update
  When the server returns 5xx
  Then the user sees a retry-capable error message without sensitive details
```

---

## 6. User Flows

### 6.1 Entry

1. User opens drawer → taps **Settings** → lands on `/settings` overview (all visible sections listed or tabbed).

### 6.2 Navigation between sections

- **Pattern (product choice):** single page with **anchored sections** OR **sub-routes** (e.g. `/settings/profile`). Engineering selects consistent pattern with drawer/back behavior on mobile.
- Persistent **breadcrumb or section title** on desktop where applicable.

### 6.3 Profile editing

1. Open Profile → edit allowed fields → **Save** → loading state → success toast/banner → optional refetch of user in `UserAuthProvider`.

### 6.4 Password change

1. Open Security → **Change password** → current + new + confirm → validate → submit → success or inline errors.

### 6.6 Account deletion

1. Open **Account** or **Danger zone** → **Delete account** → explain irreversibility → typed confirmation or checklist → submit request or execute per policy → handle post-success (logout, landing).

---

## 7. UI/UX Requirements

### 7.1 Layout & organization

- **Logical grouping:** Account (profile, security, deletion), Notifications, Privacy, Session (sign out).
- **Destructive actions** isolated visually (danger zone).
- **Mobile-first:** sections scrollable; touch targets meet WCAG spacing guidance.

### 7.2 Forms & validation

- Inline validation on blur/submit; disable submit until required fields valid or show errors on submit—pick one pattern and apply consistently across Settings.
- **Password:** masked inputs; optional show/hide toggles with accessible names.

### 7.3 Confirmations & feedback

- **Delete account:** modal with explicit consequences; irreversible wording.
- **Sign out:** confirm optional (product decision: quick sign-out vs mis-tap protection on shared devices—**recommend confirm on shared-device profile**).
- **Save success:** short-lived toast or inline **Saved** state; avoid ambiguous checkmarks without label.

### 7.4 Accessibility (a11y)

- Full keyboard navigation through sections and modals.
- Focus trap in dialogs; return focus on close.
- Screen reader labels for all toggles; state (pressed/checked) exposed.

---

## 8. Data Model & Storage

### 8.1 JSON-serializable settings schema (MVP, client)

```json
{
  "schemaVersion": 1,
  "locale": "string",
  "notifications": {
    "masterEnabled": true,
    "categories": {
      "operational": true,
      "safety": true,
      "teamDigest": false
    },
    "channels": {
      "inApp": true,
      "email": false,
      "push": false,
      "sms": false
    }
  },
  "privacy": {
    "analyticsEnabled": true,
    "crashReportingEnabled": true,
    "marketingOptIn": false
  }
}
```

**Note:** Category keys must map 1:1 to product capabilities; placeholders above require naming alignment with engineering.

### 8.2 Local storage strategy

- **Namespace:** e.g. `vassembly:user-settings:v1` or per-user key `vassembly:user-settings:{userId}:v1` on shared devices to avoid **bleed between accounts**.
- **Versioning:** `schemaVersion` in JSON; on mismatch, run migration or reset with user notice if incompatible.

### 8.3 Profile vs local preferences

| Data | Source of truth (MVP) | Notes |
|------|------------------------|-------|
| Display name, email | Backend | Refetch after save |
| Role | Backend / JWT | Read-only in UI |
| notification UI prefs, privacy toggles | Local | No sync |
| Password | Backend | Never stored locally |

### 8.4 Future backend sync (migration)

- Add optional `serverRevision` and `lastSyncedAt` to schema when API exists.
- **First sync:** server wins for overlapping keys unless user-chosen merge policy is defined later.
- Document migration in ADR when sync ships.

---

## 9. Technical Requirements

| ID | Requirement |
|----|----------------|
| T-1 | Route **`/settings`** exists in App Router and is **auth-gated**. |
| T-2 | Role string from auth drives **notification subsection** visibility (worker vs supervisor; others full unless exception). |
| T-3 | `UserAuthProvider` (or successor) reflects profile updates after successful save. |
| T-5 | **Performance:** Settings shell interactive within **2s** on mid-tier mobile on cold navigation; section switches **< 200ms** perceptual (no blocking main thread work). |
| T-6 | **Compatibility:** Latest two versions of evergreen browsers; degraded but functional behavior if localStorage unavailable. |
| T-7 | No PII in client logs from Settings flows. |

---

## 10. Notification & Privacy Specifications

### 10.1 Notification channels (honest MVP)

| Channel | Toggle shown when |
|---------|-------------------|
| In-app | Product displays in-app notification UI |
| Email | Backend sends email and user can opt in/out |
| Push | Push infra exists and user granted permission |
| SMS | SMS infra exists and legally compliant opt-in captured |

If a channel is **not** implemented, **hide** its toggle (preferred) or show disabled with **“Not available”** copy.

### 10.2 Notification categories (example set—finalize with product)

- **Operational:** work orders, station assignments.
- **Safety / critical:** stop-line, quality holds (high priority).
- **Team / coverage (supervisor):** shift gaps, escalations.
- **Approvals (supervisor):** sign-offs pending.

Worker: **exclude** team digest / approvals if those categories exist.

### 10.3 Privacy toggles

- **Can toggle:** behaviors that are **optional** and **client- or server-respected** (e.g. optional analytics script loading).
- **Cannot toggle:** security logging required for fraud/abuse, legally mandated retention, or **non-configurable** crash reports if product policy requires always-on minimal telemetry—**hide** toggle and document in privacy policy.

---

## 11. Account Deletion / Deprovision

**Note:** Account deletion is now a **separate feature** with complete product and technical specifications.

**See:** **[Account Deletion PRD](../account-deletion/prd.md)** and **[Account Deletion Architecture](../account-deletion/architecture.md)** for all requirements, acceptance criteria, and technical implementation details.

In User Settings, account deletion integration follows the separate feature specification: immediate soft-delete via `removedAt`, UI-only confirmation modal, single REST endpoint, and local session teardown.

---

| Topic | MVP specification |
|-------|-------------------|
| **Self-serve vs request** | **Open decision:** immediate self-serve deletion **if** backend supports tokenized delete; else **request + email verification** flow. PRD assumes **destructive confirmation** in all cases. |
| **Confirmation** | User must confirm via **modal**, **checkbox acknowledging data loss**, and **typed phrase** (e.g. `DELETE`) or corporate equivalent. |
| **Local data** | Clear namespaced `user-settings` keys and session; wipe cached profile. |
| **Backend** | Invalidate tokens; enqueue deletion per GDPR/retention policy; surface **pending** state if async. |
| **Shared device** | After deletion or sign-out, ensure **no residual PII** in local prefs for that user. |

---

## 13. MVP vs Future

### 13.1 MVP (explicit)

- `/settings` auth-gated; drawer entry.
- Sections: profile, security, notifications (role-aware), privacy (honest), sign-out, account deletion (per policy).
- Local persistence for non-server preferences with versioned schema.
- Confirmations for destructive actions.

### 13.2 v2 backlog (examples)

- Backend sync of preferences; org-level defaults.
- Per-device vs per-user cloud prefs.
- Admin read-only user audit of **consents** (not prefs editing).
- Richer security: device list, revoke sessions API.
- Avatar upload; locale preview.

### 13.3 Technical debt considerations

- Single role string today vs full RBAC matrix—refactor when roles expand beyond MVP strings.
- i18n: ensure new settings strings are in translation pipeline from day one.

---

## 14. Acceptance Criteria (QA)

**Functional**

- [ ] Logged-in users reach `/settings`; logged-out users cannot.
- [ ] Role `worker` cannot enable or see supervisor-only notification categories.
- [ ] Role `supervisor` sees all categories.
- [ ] Profile save updates displayed name after refresh.
- [ ] Password flow respects SSO-only state.
- [ ] Sign out clears session and returns unauthenticated state.
- [ ] Account deletion follows confirmation rules and clears local state.

**UI states**

- [ ] Loading, error, success on save actions.
- [ ] Disabled/hidden controls for unsupported channels and SSO.

**Regression**

- [ ] Drawer navigation still works for non-settings routes.

---

## 15. Open Questions & Decisions Needed

| ID | Topic | Decision required |
|----|--------|-------------------|
| Q-1 | **Role enum** | Confirm canonical roles: `worker`, `supervisor`, `planner`, `quality`, `maintenance`, `admin` and JWT claim shape when expanded beyond `user`. |
| Q-2 | **Maintenance notification tier** | Full vs worker subset. |
| Q-3 | **SSO vs password** | When SSO-only, exact copy and whether “Change password” is hidden or links to IdP. |
| Q-4 | **Account deletion policy** | Self-serve immediate vs approval workflow; legal hold exceptions. |
| Q-5 | **Backend notification channels** | Which channels ship in MVP; mapping to toggles. |
| Q-6 | **Sign out confirm** | Always vs shared-device heuristic only. |
| Q-7 | **Category names** | Final enum for analytics and RBAC mapping. |

---

## Document control

| Role | Action |
|------|--------|
| Design | Validate IA, danger patterns, mobile layouts |
| Engineering | Implement gates, storage, API integration, analytics events |
| QA | Execute Acceptance Criteria; automate Gherkin where possible |
| PM | Resolve Open Questions with legal / stakeholders |
