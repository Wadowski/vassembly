# Login Form — UI Design Specification

Design reference for a reusable **Login Form** React package in the Vassembly monorepo. Aligns with **The Synthetic Luminal** (see `.cursor/rules/design.md`) and `@vassembly/ui-system-design/theme` tokens.

---

## 1. Design Rationale

- **Atmospheric focus:** A single, centered “content island” (tonal card) on a quiet background keeps attention on sign-in without clutter.
- **Primary accent only:** Use the primary blue gradient for the submit CTA; avoid introducing a second accent on this screen.
- **Errors at a distance:** API and submission failures are communicated via **Snackbar** (global, persistent enough to read), not inline under fields—keeping the form visually calm and matching the “no-line”/tonal philosophy for the fields themselves.
- **Trust & clarity:** Legible **Inter** labels and inputs; **Space Grotesk** for the screen title to match brand voice.
- **Motion:** Transitions 300–500ms, `cubic-bezier(0.22, 1, 0.36, 1)` for focus/hover; button loading state is immediate (no extra delay before spinner).

---

## 2. Visual Mockup (ASCII)

### Desktop / tablet (centered)

```
+------------------------------------------------------------------+
|  [page background: surface or full-bleed neutral]                   |
|                                                                   |
|              +-------------------------------+    [ Snackbar     ]
|              |  [optional logo]            |    [  top-right   ]
|              |  Sign in                     |    [  (errors)   ]
|              |  body / caption (optional)   |                   |
|              |                              |                    |
|              |  Email                        |                    |
|              |  [------------------------]   |                    |
|              |                              |                    |
|              |  Password                     |                    |
|              |  [------------------------]   |                    |
|              |                              |                    |
|              |  [ Continue  (full width) ]  |                    |
|              +-------------------------------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

### Mobile (narrow)

- Same vertical stack; card uses horizontal **margin** `spacing-4` (16px) so the card never touches screen edges.
- Submit button **full width**; min tap height via `Button` `large` (see below).

---

## 3. Component Layout & Hierarchy

| Region | Content | Notes |
|--------|---------|--------|
| **Page shell** | Min-height 100vh; center card with flex (column, align center, justify center). | Optional subtle ambient glow (primary-tinted) behind card—very low opacity—if product approves. |
| **Card** | Optional logo, title, optional subtitle, form fields, CTA. | Tonal container: `surface-container-high` on `surface` background (see §5). Max width **400px**; width **100%** inside horizontal padding. |
| **Branding** | Optional logo (max height ~32–40px), title `heading-md` or `display-sm`, optional `body2`/`caption` subtitle. | Title: Space Grotesk. One accent (primary) for links only if “Forgot password” is added later. |
| **Fields** | Email, then password (stacked). | `spacing-component-gap-md` (12px) between field **wrappers**; `spacing-6` (24px) before button block. |
| **Primary action** | Single submit button, full width in the card. | Primary contained gradient per design system. |
| **Feedback** | Snackbars (portal, fixed). | **Not** inline `errorMessage` on `TextField` for API errors (see §6). |

---

## 4. Component Specifications (by element)

### 4.1 Page background

- **Default (dark, design system native):** `$color-surface` `#1a1a1e`.
- **App with system light/dark** (`apps/web` uses `prefers-color-scheme`): Prefer a **dedicated auth layout** that sets a charcoal shell (`surface` or `surface-container-lowest`) for consistency with system-design components, *or* document a light-surface card variant if the team adds light tokens later. **Minimum for handoff:** one consistent background + card pairing tested for contrast (§9).

### 4.2 Card container

- **Background:** `$color-surface-container-high` `#2e2e34` (tonal step above page).
- **Shape:** `border-radius-card` = `$border-radius-lg` (8px) — or `border-radius-2xl` (16px) for a softer auth card if matching existing app patterns; pick one and keep Storybook consistent.
- **Padding:** `spacing-8` (32px) desktop; `spacing-6` (24px) mobile.
- **Width:** `width: 100%`; `max-width: 25rem` (400px) recommended.
- **Border:** None (No-Line rule). If edge clarity is required for WCAG, use “ghost” edge: `outline-variant` at **15%** opacity (design.md).

### 4.3 Title & copy

- **Title:** `heading-md` / `display-sm` from theme — Space Grotesk, semibold/bold, `$color-text-primary` `#f5f5f7`.
- **Subtitle (optional):** `body1` or `caption`, Inter, `$color-text-secondary` `$color-neutral-50`.

### 4.4 Email field

- **Component:** `@vassembly/ui-system-design/text-field` `TextField`.
- **Props:** `type="email"`, `autoComplete="email"`, `inputMode="email"`, `label="Email"`, `isFullWidth`, `size="large"` (align with button), `variant="outlined"` or `"filled"` per design system default in Storybook.
- **Typography inside field:** Per Text — `body1` for input value (`$font-size-body-md` 1rem).
- **Focus:** Existing TextField focus (ghost border primary ~40% + glow) — do not override.
- **Helper:** Optional static helper via `helperText` only; **no** API error text here when using Snackbar for errors.

### 4.5 Password field

- **Component:** `TextField` with `type="password"`, `autoComplete="current-password"`, `label="Password"`, same size/width as email.
- **Optional future:** `trailingIcon` toggle (visibility) — out of scope unless specified; if added, ensure icon has `aria-pressed` and focus order after input.

### 4.6 Submit button

- **Component:** `@vassembly/ui-system-design/button` `Button`.
- **Props:** `color="primary"`, `variant="contained"`, `isFullWidth`, `text="Sign in"` (or product copy), `isLoading` when request in flight, `type="submit"` (parent `<form>`).
- **Size:** `large` to match large inputs and meet ~44px touch target with padding.
- **Style:** System primary gradient (135deg, `primary` → `primary` dim / `primary-container` per design.md); `border-radius-button-primary` (pill-leaning, `$border-radius-full` / 1.5rem).

### 4.7 Loading state

- **Button:** `isLoading` true → disabled, show loading affordance. (Current `Button` has a loading placeholder in implementation—handoff: use `isLoading` and ensure visible spinner/opacity per design QA.)
- **Fields:** `isDisabled` on both fields while submitting **optional**; if used, keep disabled styling from theme.

---

## 5. Spacing & Layout (token values)

| Token | Value | Usage |
|-------|--------|--------|
| `spacing-4` | 1rem | Page horizontal inset (mobile), snackbar offset from edge |
| `spacing-6` | 1.5rem | Section gap; vertical rhythm before CTA; card list separation (design system) |
| `spacing-8` | 2rem | Card padding (desktop) |
| `spacing-component-gap-md` | 0.75rem | Default gap in snackbar stack |
| `spacing-2` | 0.5rem | Snackbar gap between stacked notifications; provider default offset |

**Vertical stack inside card (recommended):**

1. Logo: margin-bottom `spacing-4` if present  
2. Title: margin-bottom `spacing-2`  
3. Subtitle: margin-bottom `spacing-6`  
4. Email field  
5. Gap `spacing-4` between fields (or `spacing-component-gap-lg` 1rem)  
6. Password field  
7. Gap `spacing-6` before button  
8. Button  

**Breakpoints** (`@vassembly/ui-system-design/theme`):

- `375px+` mobile baseline; `768px+` tablet; `1024px+` desktop.  
- Form stays single column; only padding and `max-width` of the page shell change.

---

## 6. State Variations (Visual)

| State | Appearance |
|--------|------------|
| **Default** | Empty fields, enabled button, no snackbar. |
| **Focused** | One field at a time: TextField focus ring/ghost border (primary). |
| **Filled** | Typed text in `color-text-primary`; no success styling required for normal typing. |
| **Loading** | Button `isLoading`, disabled; optional fields disabled. No inline error. |
| **Error (server/API)** | Fields **not** in `isError` for API message (or keep generic). **Snackbar** `variant="error"`, `role="alert"` (see Snackbar implementation). |
| **Success** | Optional brief **Snackbar** `variant="success"`; then **redirect** (referrer or home). Snackbar can be **short duration** (e.g. 2s) or skipped if redirect is instant. |

**Field-level validation (optional, e.g. empty submit):** Prefer Snackbar for consistency with “no inline API errors” requirement; if email format is wrong, one Snackbar with clear copy is acceptable.

---

## 7. Snackbar Integration

**Packages:** `@vassembly/ui-system-design/snackbar` — `SnackbarProvider` + `useSnackbar` (or `SnackbarContext` consumer).

| Topic | Spec |
|--------|------|
| **Position** | Recommend **`top-right`**: visible above form, does not cover primary CTA on small screens. Alternative: `bottom-right`. Avoid `bottom-center` for login if it obscures the button on mobile. (Provider default in code is `bottom-center` — **override** to `position="top-right"` for this app/feature.) |
| **Error styling** | `variant="error"`: accent `#d9869f`, border `$color-error-500`, background mix with `$color-surface-container-high` (see `Snackbar.module.scss` `.variantError`). |
| **Success styling** | `variant="success"`: success green tokens. |
| **Auto-dismiss** | Default **4000ms** per `SnackbarProvider`; errors may use 5000–6000ms if messages are long; success before redirect can be 1500–2500ms. |
| **Stacking** | `maxVisible` default 5; login should usually show one at a time (debounce repeat submits). |
| **Live region** | Provider portal `role="region"` `aria-label="Notifications"` `aria-live="polite"`. Error snackbar uses `role="alert"` on the item. |

**Integration rule:** The **app** (or a wrapper) must mount `SnackbarProvider` above the form. The reusable package can accept `onError(message)` / `onSuccess(message)` **or** require context—architect to choose; design-wise, user-visible behavior is the same.

---

## 8. Color Palette & Typography (source: `@vassembly/ui-system-design/theme`)

**Surfaces (dark):**  
`surface` `#1a1a1e` → `surface-container` `#242428` → `surface-container-high` `#2e2e34` → `surface-container-highest` `#383840` → `surface-variant` (glass) `rgba(36, 36, 40, 0.5)`.

**Text:**  
- Primary: `$color-text-primary` `#f5f5f7`  
- Secondary: `$color-text-secondary` `#a8a8ac`  
- Tertiary: `$color-text-tertiary`  

**Primary CTA / focus:**  
- `$color-primary` `#6b7a9f`, gradient `$gradient-primary`  
- Error: `$color-error` `#d9869f`, `error_container` `rgba(217, 134, 159, 0.15)` for field error state (if ever used for native validation).  

**Typography:**  
- **Display/heading (title):** Space Grotesk — e.g. `$font-size-heading-md` 1.5rem, weight semibold.  
- **Body / input / button label:** Inter — `body1` for input, `label` for button per `Button` + `TextField`.  
- **Labels (TextField):** `Text` `variant="label"` — uses label styles from text package (aligned with `$font-size-label-md` / sm).

---

## 9. Accessibility Checklist (WCAG 2.1 AA)

| # | Requirement | Implementation notes |
|---|-------------|------------------------|
| 1 | **Labels** | `TextField` renders `<label htmlFor={inputId}>` — ensure `id` not duplicated. |
| 2 | **Grouping** | Wrap in `<form>` with `onSubmit` (prevent default), single logical group; optional `aria-labelledby` pointing at title `id` if design includes heading. |
| 3 | **Required fields** | If required, use `required` on inputs and optionally `aria-required="true"`. |
| 4 | **Errors** | Snackbar: `role="alert"` for error variant (implemented). For screen readers, ensure error text is **concise and specific**. |
| 5 | **No reliance on color alone** | Error snackbar includes icon (existing); message states the problem (e.g. “Incorrect email or password”). |
| 6 | **Focus** | On failed submit, consider moving **focus to first field** or **announcing** error (snackbar is announced via alert); document product choice. On success, redirect handles next context. |
| 7 | **Keyboard** | Tab order: email → password → button → (dismiss on snackbar if `isDismissible`). Enter submits form. |
| 8 | **Focus visible** | Use browser/`Button`/`TextField` `:focus-visible` styles; no removal of outline without replacement. |
| 9 | **Contrast** | Text primary on `surface-container-high` / snackbar text on mixed backgrounds: verify **4.5:1** for body, **3:1** for large text/icons; `primary` on gradient for CTA is pre-validated in system QA (re-check if button text changes). |
| 10 | **Touch targets** | Button `large` + TextField `large` to meet **44×44px** minimum where applicable. |
| 11 | **Password** | `type="password"`; if toggle added later, label with `aria-pressed` and `aria-controls` pattern. |
| 12 | **Motion** | Respect `prefers-reduced-motion`: reduce/eliminate non-essential transitions (integrate with global CSS if available). |

---

## 10. Design System Components to Use

| Package | Use |
|---------|-----|
| `@vassembly/ui-system-design/text` | `Text` for any custom copy outside TextField. |
| `@vassembly/ui-system-design/text-field` | Email + password inputs. |
| `@vassembly/ui-system-design/button` | Submit CTA. |
| `@vassembly/ui-system-design/snackbar` | `SnackbarProvider`, `useSnackbar` (or `SnackbarContext`) for error/success toasts. |
| `@vassembly/ui-system-design/loader` | If Button loading needs explicit spinner, align with `Loader` component styling. |
| `@vassembly/ui-system-design/theme` | SCSS tokens: colors, spacing, typography, border-radius, breakpoints. |
| `@vassembly/ui-api-hooks` | `useLogin` — implementation concern; UI states follow §6. |
| `@vassembly/ui-user-auth` | `setSession` after success; redirect concern (see §11). |

**Do not** use inline `errorMessage` on `TextField` for **API** errors when product mandates Snackbar-only. Native HTML5 `required` / `type="email"` may show browser bubbles—prefer controlled validation + Snackbar for a unified UX (product decision).

---

## 11. Design Considerations

### Responsive

- **Mobile-first:** Full-width card with side padding; no horizontal scroll.  
- **Desktop:** Centered; optional max content width for ultra-wide (e.g. `1280px` max shell padding `spacing-12`).

### Dark / light

- System-design components are **dark-first** in tokens. For `prefers-color-scheme: light` on `body`, the auth page should **either** use a full dark `surface` wrapper so components match tokens, **or** a future light token pass—**document** the chosen approach in the app’s auth layout.

### Edge cases

- **Long error messages:** Snackbar `max-width: min(420px, 100vw - 16px)`; message `word-break: break-word`.  
- **Rapid double submit:** Disable button and ignore duplicate `submit` while `isLoading`.  
- **Session already exists:** App-level (redirect away from login)—not form UI.  
- **Redirect:** `document.referrer` (same-site only) or `searchParams` `returnUrl` / `from` (decode safely); fallback `/`. Use Next.js `router` in `apps/web`.

### Security / copy

- Do not show whether email **exists** in error messages; use generic “Sign-in failed” or “Incorrect email or password.”

---

## 12. Developer Handoff Summary

1. **Layout:** Centered card `max-width` 400px, padding `spacing-6` / `spacing-8`, `surface-container-high` on `surface` background.  
2. **Fields:** Two `TextField` `large`, `isFullWidth`, `type` email + password, labels “Email” / “Password”, autocomplete as in §4.  
3. **CTA:** `Button` primary contained, `isFullWidth`, `large`, `isLoading` on submit, `type="submit"`.  
4. **Errors/Success:** `SnackbarProvider` with `position="top-right"`, `show({ message, variant, duration })` from submit handler; no inline API errors.  
5. **A11y:** Form labels, `aria-invalid` only if using field-level validation, keyboard and focus-visible, alert snackbar for errors.  
6. **Post-login:** `setSession` + redirect per referrer or home.  
7. **Animation:** 300–500ms, cubic-bezier per design system for focus (if custom wrappers).

This document is the single reference for **architect** (package boundaries, app wiring) and **coder** (props, states, tokens).
