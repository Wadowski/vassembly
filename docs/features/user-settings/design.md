# User Settings — Design Specification

**Status:** Draft for engineering handoff  
**Route:** `/settings`  
**Related PRD:** [`prd.md`](./prd.md)  
**Design system:** [.cursor/rules/design.md](../../../.cursor/rules/design.md) — *The Synthetic Luminal*

---

## 1. Design Rationale

Settings must work on **shared manufacturing devices** (tablets, gloved hands, bright or dim floor lighting) while matching Vassembly’s **atmospheric, tonal-stacked** surfaces—no harsh partition lines, restrained neon (primary *or* secondary accent per screen, not both fighting for attention).

**Goals**

- **Scannable IA:** Group related controls so workers find language, theme, and sign-out quickly; isolate destructive actions in a unmistakable **danger zone**.
- **Honest controls:** Every toggle maps to real behavior or is hidden/disabled with plain-language explanation (PRD Section 3).
- **Local vs account scope:** Surface copy that clarifies what persists **on this device only** versus **on your account** without forcing dense legal text in the main UI.
- **Role-safe notifications:** Workers never see inert supervisor-only rows; engineering hides categories, not merely disables them, unless a deliberate “locked” pattern is required for discoverability (PRD: prefer hide).

**Recommended navigation pattern:** **Single scrollable page** with **sticky section index on desktop** and **optional sub-routes** (`/settings/profile`, etc.) only if the app shell already uses nested routes consistently—otherwise anchors + `AnchorList` reduce duplication. Engineering should pick one pattern app-wide; this spec assumes **anchors on one page** with optional deep links to hash IDs (e.g. `#notifications`).

---

## 2. Page Layout & Information Architecture

### 2.1 Overall layout

| Breakpoint | Structure |
|------------|-----------|
| **Mobile** (<768px) | Full-width main column. Page title + short subtitle. Vertical stack of **section cards**. Optional **horizontal scroll** of section chips (tabs-like) *or* collapsible “Jump to” `Menu` at top—avoid tiny links; minimum chip height per touch targets (Section 7). |
| **Tablet** | Same as mobile with slightly wider max content width (`max-width` ~640–720px for form comfort) or centered column with side margins. |
| **Desktop** (≥1024px) | **Two-column:** **Left (~240–280px):** sticky `AnchorList` (“On this page”) linking to `#profile`, `#security`, … **Right (fluid):** stacked section cards. Alternative: `Tabs` for **Account | Preferences | Alerts & privacy | Session** only if tab count stays ≤4 and labels stay short; nested `Tabs` inside a tab is discouraged. |

**Shell:** Reuse `Layout` + `Header` + `DrawerNavigation` (PRD: entry from drawer). Settings is **not** full-bleed marketing hero—content sits in **main** with comfortable padding (`spacing-6` horizontal minimum on mobile, `spacing-8` on desktop).

### 2.2 Section order & grouping (visual hierarchy)

Top to bottom:

1. **Page header** — Title: “Settings”; subtitle: one line, e.g. “Account and preferences for this device.”
2. **Account** — Profile (`#profile`), Security (`#security`)
3. **Alerts & privacy** — Notifications (`#notifications`), Privacy (`#privacy`)
4. **Session** — Sign out (`#session`) — visually separated but **not** in danger styling
5. **Danger zone** — Account deletion (`#account-deletion`) — tonal shift + error-tinted containment (Section 8)

**Within each section card:** Optional **overline** (`Text` label variant, uppercase, tracked — design system “technical readout”) for the group name repeating the anchor label on desktop is optional; on mobile skip overline if redundant with card title.

### 2.3 Visual hierarchy & grouping

- **Card = one section** from the PRD. Use **tonal stacking**: page `surface`, card `surface-container` or `surface-container-high` (PRD/design: no 1px borders; separate cards with vertical gap `spacing-6`–`spacing-8`).
- **Subgroups** inside a card (e.g. “Password” vs “Sign-in methods”) separated by **spacing** only; add a short **subheading** (`Text` `title-sm` / `body` bold) if more than one distinct form cluster exists.

### 2.4 Responsive behavior summary

- Stacks always; no horizontal-only critical actions.
- **Sticky** left nav / anchor list: **desktop only**; on mobile, anchors can jump scroll with `scroll-margin-top` below fixed header height to avoid obscured headings.
- Forms: primary actions **below** fields on narrow viewports; on wide viewports **right-aligned** Cancel + Save in one row is acceptable.

### 2.5 Touch-friendly (manufacturing)

- **Minimum touch target:** **44×44 CSS px** per control; if visual control is smaller, expand **hit slop** (`padding`/`min-height`/`::before` tap area).
- **Spacing between tappable rows:** **≥8px** gap between distinct targets; prefer **12–16px** for toggle rows to reduce mis-taps with gloves.
- **Primary actions** on profile/password: use `Button` **`size="large"`** where the design system allows for floor use.

---

## 3. Visual Components & Patterns

### 3.1 Settings section card / panel

- **Container:** Rounded corners consistent with existing cards (button xl rounding is for buttons; cards follow theme token for `radius-lg` if defined—else match existing login/register forms).
- **Header row:** Section title (`Text` headline or `title-md`) + optional **“Saved”** / **“Unsaved changes”** badge area (inline `Text` muted) on the right for forms with explicit save.
- **Body:** Fields and controls; trailing **action row** for section-scoped buttons.
- **No divider lines** between fields; use consistent field vertical rhythm (e.g. `spacing-4` between `TextField`s, `spacing-5` before action row).

### 3.2 Form field patterns

| Control | Component | Notes |
|--------|-----------|--------|
| Short text | `@vassembly/ui-text-field` (`TextField`) | Labels always visible; placeholders not sole label. |
| Password | `TextField` + **show/hide** affordance if supported; else native `type="password"` with visible label | Announce toggle for SR. |
| Toggle (on/off) | `@vassembly/ui-switch` (`Switch`) | One primary label; helper `Text` `body2` muted below if needed. |
| Multi-step confirm | `Checkbox` from `@vassembly/ui-checkbox` for acknowledgments | Required for account deletion. |

### 3.3 Buttons

| Use | `Button` mapping |
|-----|------------------|
| Save / Apply / primary continue | `color="primary"` `variant="contained"` |
| Cancel / secondary | `color="secondary"` `variant="outlined"` **or** `variant="text"` for low emphasis |
| Neutral navigation | `color="tertiary"` `variant="text"` |
| Delete / irreversible in modals | `color="danger"` `variant="contained"` for final confirm; **never** full-width danger on page without modal gate |

Use **`isLoading`** during submit; **`isFullWidth`** on mobile for primary save rows.

### 3.4 Feedback: success, error, loading

- **Inline field errors:** `TextField` error state (error token + helper text); focus first invalid field on submit.
- **Section / form errors (API):** **`Alert`** (`@vassembly/ui-alert`) above the action row, non-dismiss auto for validation; dismissible for informational recoverable errors.
- **Transient success:** **`Snackbar`** (`@vassembly/ui-snackbar`) — short copy: “Profile saved” / “Password updated” / “Preferences saved on this device”; respect reduced motion.
- **Blocking operations:** Inline on button via `isLoading`; optionally **`Loader`** (`@vassembly/ui-loader`) in modal body for deletion pending state.

### 3.5 Confirmation dialogs

- **Account deletion:** `@vassembly/ui-modal` (`Modal`) — focus trap, `aria-modal="true"`, return focus to triggering control on close.
- **Sign-out (recommended on shared devices):** optional second-step confirm modal **or** destructive-styled confirm; PRD open question Q-6—**design default:** confirm dialog on floor/shared context (can be user setting later—out of MVP).

---

## 4. Specific Section Designs

### 4.1 Profile (`#profile`)

**Content (MVP)**

- **Display name** — `TextField`, required when shown, max length per PRD (1–80 trim).
- **Email** — If read-only: display as `Text` + optional “Contact admin to change” if product policy; if editable, `TextField` `type="email"`.
- **Role** — Read-only row: label “Role”, value from JWT/profile; helper: “Your role is assigned by your organization.”
- **Avatar** — Omit until API exists; placeholder **do not** show empty upload UI.

**Flow**

- **View** → **Edit**: either inline editable fields with always-visible Save, or “Edit profile” `tertiary` button that revealsSave row—prefer **single-page inline** for manufacturing (fewer taps).
- **Actions:** `Save` (primary) + `Cancel` (secondary) when dirty; Cancel reverts local draft to last loaded server values.

### 4.2 Security (`#security`)

**Blocks**

1. **Password change** (if password auth) — Fields: current, new, confirm new; policy hint below new password (`Text` subtle); `Save` submits single form.
2. **SSO-only** — Hide password fields **or** replace with single `Alert` / info panel: “Password is managed by your organization’s sign-in.” Optional link to IdP self-service (copy TBD Q-3).
3. **MFA / SSO status** — Read-only lines: “Two-step verification: On/Off/Not set up” — only if data exists; else hide block.
4. **Session** — Copy: “You’re signed in on this device.” If “sign out elsewhere” exists in future, placeholder copy can be hidden in MVP.

**Sign out** lives in **Session** section (below) to match PRD grouping; avoid duplicating unless a compact header action is added later.

### 4.3 Notifications (`#notifications`)

**Structure**

- **Master toggle** — “In-app notifications” — `Switch` at top of card; when off, **disable** category toggles below (visually muted + `aria-disabled` + not focusable) **or** hide categories—prefer **disabled with helper** “Turn on to choose categories” for clarity.
- **Categories** — List of rows: label (plain language) + `Switch`; grouped under subheading “What you’re notified about.”
- **Channels** — Subheading “How we reach you”; one row per channel that **exists** in product; hide entirely if not implemented (PRD 10.1).

**Worker vs supervisor**

- **Worker:** Only operational, safety/critical, shift/handover-relevant categories—**no empty rows** for hidden categories.
- **Supervisor:** Full set including team/coverage, approvals.
- **Direct URL:** If deep link to hidden category, show **inline message** at top of Notifications card: “That option isn’t available for your role.” (`Alert` info variant) and scroll to top.

### 4.4 Privacy (`#privacy`)

- Rows: Analytics, crash reporting, marketing (each only if applicable).
- Each row: title + one-line **honest** description + `Switch`.
- Required/minimal telemetry (if any): **omit toggle**; optional link “Learn more” to privacy policy (`Text` `body2` link).

### 4.5 Account deletion (`#account-deletion`)

**Danger zone**

- Contained block: `surface` step lower than page or **error_container** wash at **low opacity** (design system: subtle, not screaming red fill).
- Short **consequence list** (bulleted `Text`): loss of access, data handling per policy (non-legal summary).
- Primary control: `Button` `color="danger"` `variant="outlined"` text “Delete account…” — opens **Modal**.

**Modal flow**

1. Title: “Delete your account?”
2. Body: irreversible statement + what happens to sessions and local data (plain language).
3. `Checkbox`: “I understand this cannot be undone.”
4. `TextField`: Type **DELETE** (or product phrase) — label visible; validation case-sensitive unless PM says otherwise.
5. Actions: `Cancel` (secondary) + `Delete account` (danger contained) disabled until checkbox + typed phrase valid.
6. **Pending:** `Loader` + disabled buttons; success → logout UX + landing; failure → `Alert` in modal + retry.

### 4.6 Session (`#session`)

- **Sign out** — `Button` `secondary` `outlined` or `danger` **outlined** only if treating as destructive; PRD recommends **confirm on shared devices** — use modal with “Sign out of this device” + Cancel.

---

## 5. Role-Based Visibility

### 5.1 Visual pattern

- **Default:** **Do not render** rows the role cannot use (notifications categories, unavailable channels).
- **Future extensibility:** Centralize **section registry** `{ id, title, rolesAllowed, anchor }` so new roles map without redesign; empty section after filter → **omit entire card** (no “empty” profile card).

### 5.2 Communicating unavailability

- **Hidden by role:** No placeholder card; user should not feel a “missing feature bug.”
- **Hidden by feature flag / no backend:** Prefer **disabled row** with helper “Not available” only when user expectation exists (e.g. SMS channel); else hide row (PRD 10.1).
- **Deep link / stale bookmark:** Neutral `Alert` (Section 4.3).

### 5.3 Admin / special roles

- PRD: admin has **no** extra self-serve powers for **other** users; UI identical to visibility matrix—**no** “admin” badge in Settings unless product marketing requires it elsewhere.

---

## 6. States & Interactions

### 6.1 Unsaved changes

- **Indicator:** Subtle text next to section title: “Unsaved changes” (`Text` muted) when form dirty.
- **Navigation away:** Browser `beforeunload` only as last resort; prefer in-app route change prompt if router supports—MVP acceptable: lossy with Snackbar warning on next visit is **not** ideal; engineering should align with app pattern.
- **Per-section save** for Profile/Password; **immediate persist** for toggles/theme/language (local) with optimistic UI.

### 6.2 Save / Cancel

- **Profile/Password:** Primary `Save`, secondary `Cancel` (revert).
- **Local prefs:** No Save button; immediate write + failure path (Section 10).

### 6.3 Section collapse / expand

- **Optional** `Accordion` for very long Notifications on mobile; **default expanded** for manufacturing (reduce cognitive load). Desktop: expanded.

### 6.4 Loading

- Submit: button `isLoading`; disable fields if double-submit is a risk.
- Initial page: skeleton **optional**; prefer fast shell (PRD T-5) with section-level spinners only if data slow.

### 6.5 Success / error messaging

- **Success:** `Snackbar` 3–5s; don’t rely on color alone—include word “Saved” or “Updated.”
- **Error:** Persistent `Alert` until dismissed or retry succeeds for server errors.

### 6.6 SSO-only password block

- **Hidden** fields preferred; if **disabled** fields shown instead, pair with short explanation above—never disabled fields without text.

---

## 7. Accessibility & Manufacturing Context

### 7.1 WCAG 2.1 AA

- **Contrast:** Interactive text and labels meet **4.5:1** normal text; toggles/radios have visible **checked** state not color-only (position + fill).
- **Focus:** Visible focus ring using `primary` ghost border pattern; modal traps focus.
- **Labels:** Explicit `<label>` / `aria-labelledby` for all inputs; switches expose `checked` state.
- **Motion:** Honor `prefers-reduced-motion` (Section 9).

### 7.2 Floor / high-contrast needs

- Do not reduce contrast for “prettier” glass; ensure **label-sm** overlines still meet contrast on `surface-container`.
- **Outdoor glare:** Rely on strong typographic hierarchy and spacing, not faint gray-on-gray microcopy.

### 7.3 Plain language

- Avoid “telemetry,” “locale,” “SSO” without gloss—use “Usage analytics (helps us improve)” with optional “Details” link.
- **Destructive** copy: short, literal consequences.

### 7.4 Keyboard

- Logical tab order within cards; `AnchorList` / tabs fully keyboard operable; modal Escape closes and returns focus.

### 7.5 Screen readers

- Announce **dynamic** `Alert` and `Snackbar` via `role="status"` / live region patterns already in `Alert`/`Snackbar` components—verify on implementation.
- **Loading:** `aria-busy` on form when appropriate.

---

## 8. Visual Style Guidance

### 8.1 Color & surfaces (Synthetic Luminal)

- **Page background:** `surface`; **cards:** `surface-container` → `surface-container-high` for emphasis.
- **Danger zone:** subtle `error` / `error_container` **wash**; **danger** CTA uses system `danger` button token—**one** accent screen: **primary** for normal actions; **danger** only inside danger zone + modal.
- **Max two neon accents per screen:** default **primary** for focus/save; **secondary** optional for non-destructive highlights—**not** alongside heavy primary gradients in same card.

### 8.2 Typography

- **Section titles:** Space Grotesk per design system for display impact at page title; subsection titles may use Inter `title-*` for density.
- **Body / labels:** Inter; **category overlines** optional `label-sm` uppercase tracked in `primary` tint.
- **Numbers / PIN / typed DELETE:** Space Grotesk acceptable for monospaced-like alignment if product uses it elsewhere.

### 8.3 Spacing & sizing

- **Page padding:** `spacing-6` mobile, `spacing-8` desktop minimum.
- **Card padding:** `spacing-5`–`spacing-6` internal.
- **Field stack:** `spacing-4` default; increase to `spacing-5` for toggle rows on touch profiles.

### 8.4 Icons

- Use `@vassembly/ui-icons` sparingly: **section headers** optional (user, shield, bell, eye, palette, globe, trash); **always** pair with text labels—icons are decorative unless `aria-hidden`.

### 8.5 Danger zone

- **Outlined** danger button on page; **filled** danger only in modal final step.
- **No** playful motion on destruction path.

---

## 9. Motion & Feedback

### 9.1 Section navigation

- Anchor jumps: **smooth scroll** 300–400ms **unless** `prefers-reduced-motion: reduce` → instant jump.
- `Tabs`/`AnchorList` active indicator transition **300–500ms** `cubic-bezier(0.22, 1, 0.36, 1)` per design system.

### 9.2 Success / error

- **Snackbar enter/exit:** subtle slide + fade; reduced motion → fade only.
- **Modal:** backdrop fade 300ms; content scale minimal (max 2%) or opacity only—avoid large bounces.

### 9.3 Loading

- **Button** loading spinner via `Button` `isLoading`.
- **Skeleton:** `Skeleton` component for slow profile fetch only.

### 9.4 Toast / snackbar policy

- **Stacking:** one at a time for settings to avoid overlap on small screens.
- **Persistence:** success short; errors that need action use `Alert` in context.

---

## 10. Edge Cases & Error States

| Scenario | UX |
|----------|-----|
| **Offline** on profile/password save | `Alert` error: “You’re offline. Check connection and try again.” No success `Snackbar`. |
| **Validation** | Per-field messages; submit scrolls to first error. |
| **API 5xx** | Generic retry message; safe to retry Same action. |
| **401 / session expired** | Modal or full-screen auth prompt: “Session ended. Sign in to continue.” Preserve **local** prefs; do **not** claim server save. |
| **Local storage quota / blocked** | `Snackbar` or `Alert`: “This device couldn’t save your preferences.” Offer “Try again” after user frees space; fallback to session-only prefs if technically feasible—disclose honestly. |
| **Deletion pending (async)** | Modal shows pending state; email follow-up message copy if workflow is request-based (PRD §11). |
| **Worker hits supervisor URL** | Notifications `Alert` (Section 4.3). |

---

## 11. Wireframes & Key Screens (Annotated)

**Legend:** `[ ]` text field, `( )` radio, `{ }` button, `|—|` switch, `===` card boundary

### 11.1 Settings overview (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER  [≡]  Vassembly                                    [user menu?]   │
├──────────────┬───────────────────────────────────────────────────────────┤
│ On this page │  Settings                                                 │
│              │  Account and preferences for this device.                 │
│ • Profile    │  ========================================================  │
│ • Security   │  == Profile                                    [Saved ✓]  ==  │
│ • Theme      │  == Display name [________________________]              ==  │
│ • Language   │  == Email        you@org.com          (read-only note)     ==  │
│ • Notif...   │  == Role         Supervisor                            ==  ==
│ • Privacy    │  == [ Save ]  [ Cancel ]                              ==  ==
│ • Session    │  ========================================================  │
│ • Delete…    │  == Security                                            ==  ==
│              │  == ... password fields ...                              ==  ==
│              │  == MFA: On (read-only)                                  ==
│              │  --------------------------------------------------------  │
│              │  == Theme                                               ==  ==
│              │  == ( ) System   ( ) Light   ( ) Dark                    ==  ==
│              │  ...                                                     │
│              │  ========================================================  │
│              │  || DANGER ZONE                                         ||  │
│              │  || Delete account…  {Delete account…}                    ||  │
└──────────────┴───────────────────────────────────────────────────────────┘
```

**Breakpoints:** Below 1024px, drop left column; add top “Jump to” or section headings only.

### 11.2 Profile editing (mobile)

```
┌─────────────────────────────┐
│ ← Settings                  │
├─────────────────────────────┤
│ Profile                     │
│ Unsaved changes             │
│                             │
│ Display name                │
│ [____________________]      │
│                             │
│ Email                       │
│ you@org.com                 │
│ You can’t change email here.│
│                             │
│ Role                        │
│ Worker                      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Save                    │ │
│ └─────────────────────────┘ │
│ {Cancel}                    │
└─────────────────────────────┘
```

**Notes:** Full-width primary `Button` `large`; secondary text or outlined below.

### 11.3 Password change

```
┌─────────────────────────────┐
│ Security                    │
│                             │
│ Current password            │
│ [____________________] 👁   │
│                             │
│ New password                │
│ [____________________] 👁   │
│ Use at least N characters…  │
│                             │
│ Confirm new password        │
│ [____________________] 👁   │
│                             │
│ ┌─────────────────────────┐ │
│ │ Update password         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Errors:** Inline under fields + `Alert` if server rejects current password.

### 11.4 Account deletion confirmation (modal)

```
┌────────────────────────────────────────┐
│ Delete your account?               [X] │
│                                        │
│ This permanently removes access.       │
│ • You will be signed out everywhere.   │
│ • Some records may be kept per policy. │
│                                        │
│ ☐ I understand this cannot be undone.  │
│                                        │
│ Type DELETE to confirm                 │
│ [__________________________]         │
│                                        │
│  {Cancel}          {Delete account}  │
└────────────────────────────────────────┘
```

**States:** Delete disabled until checks valid; loading replaces button content.

### 11.5 Role-based “hidden” deep link (notifications)

```
┌─────────────────────────────┐
│ Notifications               │
│ ┌─────────────────────────┐ │
│ │ That option isn’t       │ │
│ │ available for your role.  │ │
│ └─────────────────────────┘ │
│ In-app notifications |—| ON │
│ … worker categories only …  │
└─────────────────────────────┘
```

---

## 12. Developer Handoff — Component Checklist

| UI need | Package / component |
|--------|----------------------|
| Page text, labels, titles | `@vassembly/ui-text` (`Text`) |
| Primary/secondary/danger actions | `@vassembly/ui-button` (`Button`) — `danger`, `isLoading`, `size` |
| Text inputs, password | `@vassembly/ui-text-field` (`TextField`) |
| Toggles | `@vassembly/ui-switch` (`Switch`) |
| Checkboxes (deletion ack) | `@vassembly/ui-checkbox` (`Checkbox`) |
| Delete / sign-out confirm | `@vassembly/ui-modal` (`Modal`) |
| Toasts | `@vassembly/ui-snackbar` (`Snackbar`) |
| Inline banners | `@vassembly/ui-alert` (`Alert`) |
| Section jump (desktop) | `@vassembly/ui-anchor-list` (`AnchorList`) — `size="large"` for touch |
| Optional top-level grouping | `@vassembly/ui-tabs` (`Tabs`) — keep tab count small |
| Long mobile sections | `@vassembly/ui-accordion` (`Accordion`) — optional |
| Loading body | `@vassembly/ui-loader` (`Loader`) |
| Shell | `@vassembly/ui-components-layout` (`Layout`) + drawer/header as today |

**Engineering alignment**

- **Auth gate:** `/settings` client/server per PRD T-1.
- **Storage keys:** per-user namespace on shared devices (PRD §8.2).
- **Analytics:** events in PRD §12.2 — no PII in payloads.

---

## 13. Open Questions (design dependencies)

Track with PRD §15: **Q-2** maintenance notification tier; **Q-3** SSO copy; **Q-4** deletion policy affects modal copy; **Q-5** channel visibility; **Q-6** sign-out confirm default (this spec recommends confirm on shared devices); **Q-7** category naming for UI labels.

---

## Document control

| Role | Action |
|------|--------|
| Engineering | Implement layout, gating, storage, modals, and component integration per §12 |
| QA | Cross-check PRD Acceptance Criteria + interaction states in §6–§10 |
| Design | Update wireframes if IA shifts to sub-routes exclusively |
