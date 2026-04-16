# Drawer / Sidebar Navigation — Architecture

Implementation plan for `@vassembly/ui-drawer-navigation`, aligned with [design.md](./design.md). **No implementation code** — this document defines APIs, layering, reuse, and delivery steps.

---

## Analysis

### Librarian findings (reuse vs greenfield)

- **Greenfield**: No existing drawer, sidebar, sheet, or off-canvas package under `ui/`.
- **Strong partial reuse**:
  - **`@vassembly/theme`** — surfaces, text, primary/secondary/tertiary/error, gradients, breakpoints (`$breakpoint-desktop` = 1024px), spacing scale, z-index scale (`$z-index-modal-backdrop`, `$z-index-modal`, etc.).
  - **`@vassembly/ui-utils`** — `resolveClassName` and shared patterns used across DS components.
  - **`@vassembly/ui-text`** — typography roles (`label-sm`, `body-md`, …) for nav labels and links where applicable.
  - **`@vassembly/ui-button`** — primary **Log in** CTA (gradient, height 44px, rounded treatment per button variants).
  - **`@vassembly/ui-icons`** — chevron, gear, logout/door, optional external-link icon.
  - **`@vassembly/ui-modal`** — reference only for overlay stacking, backdrop dismiss mental model, and simple `aria-*` patterns; **not** a runtime dependency unless a shared focus helper is later extracted.
  - **`@vassembly/ui-accordion`** — reference for disclosure semantics; nav groups differ (routing, nested indent, chevron spec), so **extend ideas, do not subclass**.
- **Motion**: No shared `framer-motion` / spring library in `ui/`; prefer **CSS transitions** in component SCSS modules (consistent with other DS packages).
- **A11y utilities**: No dedicated package; implement ARIA/focus behavior inside this component (or a tiny internal `hooks/` folder), mirroring README-level expectations from `@vassembly/ui-button`.
- **Storybook**: `ui/storybook` globs `**/src/**/*.stories.*` under `ui/` — new stories are picked up automatically; **`@storybook/addon-a11y`** is already a dev dependency of the Storybook app.
- **Workspace placement**: `pnpm-workspace.yaml` includes `ui/*` and `ui/system-design/*`. **All design-system components today live under `ui/system-design/<kebab-case>/`**. The taxonomy document still mentions `packages/ui/`; **actual placement for this feature** is `ui/system-design/drawer-navigation/`. Top-level `ui/` is reserved for apps like `ui/storybook` and `ui/api-hooks` — avoid introducing a second DS root without an explicit platform decision.

### Domains / services

- **None** for this UI package. Authentication and user data remain **host app** concerns; the drawer accepts **props and callbacks** only.

### Gaps to close during implementation

- **Semantic naming drift**: Design copy uses Material-style names (`on-surface`, `on-surface-variant`). Theme SCSS today exposes `$color-text-primary`, `$color-text-secondary`, `$color-text-tertiary`, `$color-surface-container*`, etc. Implementers must map explicitly (table below).
- **Light mode**: Design allows a light variant; theme grep shows **dark-first** token files. Light support may require **theme extensions** or **drawer-scoped modifier classes** — track as a follow-up if product mandates light in MVP.
- **Z-order vs modals**: Mobile overlay drawer must coexist with `@vassembly/ui-modal`. Document stacking: drawer overlay should use z-index **at or below** modal backdrop unless product requires drawer above modals (unlikely).

---

## Architecture & package placement

### Package

| Field | Value |
|--------|--------|
| **Path** | `ui/system-design/drawer-navigation/` |
| **npm name** | `@vassembly/ui-drawer-navigation` |
| **Category** | Design-system UI (`ui/system-design/*`) |
| **Consumers** | `apps/web` (and future apps) — host supplies routing, auth, and nav data |

### Dependency graph (planned)

```
@vassembly/ui-drawer-navigation
  → @vassembly/theme (required)
  → @vassembly/ui-utils (required)
  → @vassembly/ui-text (recommended for label/body styles)
  → @vassembly/ui-button (recommended for Log in)
  → @vassembly/ui-icons (required for row + footer icons)
  → react, react-dom
```

**Avoid** depending on `@vassembly/ui-modal` at runtime unless a deliberate shared primitive (e.g. body portal helper) is introduced repo-wide.

### Data flow (host → package)

1. Host owns **session state**, **router location**, and **nav config** (tree, max depth 2 per design).
2. Host passes **callbacks** (`onNavigate`, `onLogin`, `onRegister`, `onLogout`, `onOpenSettings`) and **opaque user DTO** for the authenticated footer.
3. Package **never** imports router libraries; URLs are strings or host-rendered `children` for a row when needed (`renderLink` pattern — see API).

### File / module layout (illustrative)

Respect the **≤100 lines per file** workspace rule: split types, hooks, and presentational pieces.

- `src/index.ts` — public exports only.
- `src/types.ts` — all public interfaces/types.
- `src/DrawerNavigation.tsx` — root composition (thin).
- `src/DrawerShell.tsx` — panel + padding + scroll region.
- `src/DrawerOverlay.tsx` — scrim + slide-in shell (mobile); optional portal to `document.body`.
- `src/NavSectionLabel.tsx`
- `src/NavLinkRow.tsx`
- `src/NavCollapsibleGroup.tsx` (+ `NavCollapsibleGroup.module.scss`)
- `src/DrawerFooterAuth.tsx`
- `src/DrawerFooterUser.tsx`
- `src/matchActiveNavItem.ts` — pure helpers for default active matching.
- `src/useReducedMotion.ts` — wraps `matchMedia('(prefers-reduced-motion: reduce)')`.
- `src/drawer-navigation.tokens.scss` — local motion constants (easing, durations) importing theme where useful.
- Colocated tests: `*.test.tsx` next to modules.
- Colocated stories: `DrawerNavigation.stories.tsx` (and smaller story files if needed).

---

## Component hierarchy & decomposition

```
DrawerNavigation (root, controlled responsive behavior via props + CSS)
├── DrawerOverlay? (mobile only: scrim + focus/Escape; sibling to panel)
│   └── [scrim button / clickable backdrop]
├── DrawerShell (fixed width rail, surface tokens, column flex)
│   ├── [optional slot] headerSlot | branding props
│   ├── <nav aria-label="…"> (primary landmark)
│   │   ├── NavSectionLabel
│   │   ├── NavLinkRow | NavCollapsibleGroup (recursive max depth 2)
│   │   └── …
│   ├── flex spacer (grow)
│   └── footer region
│       ├── DrawerFooterAuth (unauthenticated)
│       └── DrawerFooterUser (authenticated)
```

**Optional internal** (not necessarily exported): `NavGroupChildRow` as a thin wrapper around `NavLinkRow` with indent + `body-sm` emphasis, or implement indent via `NavLinkRow` variant prop `density: 'default' | 'nested'`.

---

## Design token mapping (design.md → `@vassembly/theme`)

Use **SCSS variables** from `@vassembly/theme` token partials (same pattern as `@vassembly/ui-button`). Where design specifies opacity, prefer `rgba(...)` or documented opacity on a base token.

| Design concept | Suggested theme mapping | Notes |
|----------------|-------------------------|--------|
| App `surface` (behind drawer) | `$color-surface` | Context for elevation read |
| Drawer panel | `$color-surface-container` | Matches design hex |
| Row hover / active row | `$color-surface-container-high` | |
| Scrim | `$color-surface-container-lowest` @ **60%** opacity | Design spec; implement as `rgba` derived from token |
| Footer dock | `$color-surface-container-low` **or** glass | Glass: `$color-surface-variant` + `backdrop-filter: blur(20px)` per design |
| Section label (caps, primary) | `$color-primary` or `$color-primary-600` | Verify WCAG on any light variant |
| Nav text default | `$color-text-primary` @ **87%** opacity | Design “on-surface 87%” |
| Nav text hover/active | `$color-text-primary` @ 100% | Weight changes per design |
| Muted / footer email | `$color-text-secondary` | Maps “on-surface-variant” |
| Icon default | `$color-primary-fixed-dim` | Per design |
| Focus ring | `$color-primary-500` or focus shadow token if shared | “Ghost” ring: 40% opacity, 2px offset — align with `$shadow-focus-ring` if present in theme |
| Active 4px bar | `$gradient-primary` or vertical fade using `$color-primary-600` | |
| Logout hover | `$color-error` (text only) | |
| Primary CTA | `$gradient-primary` | Use `@vassembly/ui-button` primary variant where possible |

**Spacing**: Design’s “4px grid” labels (`spacing-4` = 16px) align with **`$spacing-4` = 1rem** when root font size is 16px — confirm visually. Use **`$spacing-3` (0.75rem)** for **12px** child inset if that matches product rounding; otherwise use explicit `12px` with a one-line token TODO for design parity.

**Typography**: Compose `@vassembly/ui-text` variants to match `label-sm`, `body-md`, `title-md`/`title-lg` for branding; section labels **ALL CAPS + letter-spacing +600** as in design.

**Motion constants** (single source in `drawer-navigation.tokens.scss`):

- Duration: **400ms** (collapse/expand, chevron rotation); overlay slide design range **320–400ms** — pick **400ms** for consistency unless UX asks otherwise.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion: reduce`: **instant** or **≤100ms** opacity-only; **no** large `max-height` animation.

---

## Responsive design

| Viewport | Behavior | Implementation approach |
|----------|----------|-------------------------|
| **≥ 1024px** (`$media-desktop`) | Persistent sidebar; main content offset by rail width | Host layout applies `margin-left` / grid column **or** package exports a **fixed** panel without scrim. Root prop `layout="persistent" | "overlay"` (host sets from `matchMedia` or CSS container queries in app). |
| **768–1023px** | Design: optional 72px rail is **future**; MVP may use **same as mobile overlay** or persistent full width — **default MVP**: overlay for `<1024` only if host sets `layout="overlay"` below desktop. |
| **< 1024px** (non-persistent) | Overlay + scrim; slide from left | `DrawerOverlay` + `translateX` transition; scrim click closes; `blur(0)` per design. |

**Dimensions**: Inner content width **280px** + horizontal padding **$spacing-4** each side → **~312px** total rail width (design §2 / §3).

---

## Animation & motion strategy

- **Technology**: CSS `transition` on `transform` (panel), `opacity` (scrim, collapsed children), and `grid-template-rows` **0fr → 1fr** (preferred for collapsible body per design) **or** `max-height` with generous cap if grid approach conflicts with nested depth.
- **Chevron**: CSS `transform: rotate(...)` with **180°** open vs collapsed state (**-90°** when collapsed if using single chevron-down asset — match design inventory).
- **Stagger**: Optional **50ms** delay per child item, max **3** items — feature-flag via prop `isStaggerEnabled` default `false` to reduce complexity in MVP.
- **Reduced motion**: `useReducedMotion` short-circuits durations; optionally force `opacity` only on group body.

---

## Accessibility

| Requirement | Approach |
|-------------|----------|
| Landmarks | Single `<nav aria-label={mainNavAriaLabel}>` default `"Main"` (overridable prop). Footer actions **outside** that `<nav>` or inside a **separate** `<nav aria-label="Account">` — pick one documented pattern; prefer **footer outside main nav** with `role="region"` + `aria-label` for dock. |
| Groups | Header is `<button type="button">` with `aria-expanded`, `aria-controls={id}` matching child list `id`. |
| Keyboard | `Tab` through interactive rows; `Enter`/`Space` toggle group; **Escape** closes **overlay** drawer and returns focus to **opener** (host passes `openerRef` or `returnFocusToElement`). |
| Focus order | Header → main nav links (depth-first) → footer. |
| Focus visible | `:focus-visible` styles aligned with design ghost ring. |
| Touch targets | Row min-height **44px**; chevron integrated in header button. |
| Overlay | Prefer native **`<dialog>`** for mobile overlay mode **if** it simplifies focus management and Escape; otherwise mirror modal’s portal + `aria-modal="true"` on panel and document required `useEffect` focus restore. |

---

## State management

- **All state is controlled or derived from props** — no global store in the package.
- **Open/close** (overlay): `isOpen`, `onOpenChange` on root (or on `DrawerOverlay`).
- **Collapsible groups**: Prefer **uncontrolled default** with optional `defaultExpandedIds` + internal state **or** fully controlled `expandedGroupIds` + `onExpandedChange` for SSR/hydration parity — **recommend controlled** for Storybook clarity and router-driven sections.
- **Authentication**: `authState: 'guest' | 'user'` derived from `isAuthenticated` boolean; user profile via `user` prop when authenticated.

---

## Public types & data structures (`src/types.ts`)

### Navigation model (depth ≤ 2)

```ts
// Conceptual — implement as strict TypeScript interfaces (no `any`).

type NavMatchMode = 'exact' | 'prefix';

type NavIconName = string; // constrained to icon registry keys if a shared type is exported from @vassembly/ui-icons

interface NavBadge {
  readonly value: string;
  readonly ariaLabel?: string;
}

interface NavLinkItemBase {
  readonly id: string;
  readonly label: string;
  readonly icon?: NavIconName;
  readonly badge?: NavBadge;
  readonly match?: NavMatchMode;
  readonly isDisabled?: boolean;
}

/** Leaf: navigates */
interface NavLinkItem extends NavLinkItemBase {
  readonly kind: 'link';
  readonly href: string;
  readonly isExternal?: boolean;
}

/** Group: toggles children; children are links or nested groups (max depth enforced at type/runtime) */
interface NavGroupItem {
  readonly kind: 'group';
  readonly id: string;
  readonly label: string;
  readonly icon?: NavIconName;
  readonly defaultOpen?: boolean;
  readonly children: ReadonlyArray<NavLinkItem | NavGroupItem>;
}

interface NavSection {
  readonly id: string;
  readonly label: string;
  readonly items: ReadonlyArray<NavLinkItem | NavGroupItem>;
}

type NavigateReason = 'link' | 'logo' | 'settings' | 'login' | 'register';

interface DrawerNavigateEvent {
  readonly href: string;
  readonly itemId: string;
  readonly reason: NavigateReason;
}
```

**Depth enforcement**: At runtime, reject or flatten depth > 2 with a dev-only warning.

### User DTO (authenticated footer)

```ts
interface DrawerUser {
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly initials?: string;
  readonly roleLabel?: string;
}
```

---

## Component APIs (props interfaces)

Naming is indicative; use **named exports** per repo standards. **Object params** for callbacks with multiple fields where useful.

### `DrawerNavigation`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `layout` | `'persistent' \| 'overlay'` | yes | Host-driven; maps to responsive strategy. |
| `isOpen` | `boolean` | overlay: yes | Visible when overlay. |
| `onOpenChange` | `(args: { isOpen: boolean; reason: 'scrim' \| 'escape' \| 'programmatic' }) => void` | overlay: yes | |
| `sections` | `ReadonlyArray<NavSection>` | yes | Primary nav structure. |
| `currentPath` | `string` | recommended | For default active detection. |
| `isActiveHref` | `(href: string, item: NavLinkItem, currentPath: string) => boolean` | optional | Overrides default matcher. |
| `isAuthenticated` | `boolean` | yes | Switches footer. |
| `user` | `DrawerUser` | if authenticated | |
| `onNavigate` | `(event: DrawerNavigateEvent) => void` | yes | Host performs router.push / window.location / Next router. |
| `onLogout` | `() => void` | if authenticated | |
| `onLogin` | `() => void` | if guest | |
| `onRegister` | `() => void` | if guest | |
| `onOpenSettings` | `() => void` | if authenticated | |
| `branding` | `{ productName: string; tagline?: string; logo?: ReactNode }` | optional | |
| `mainNavAriaLabel` | `string` | optional | Default `"Main"`. |
| `className` | `string` | optional | Passed to outer shell. |
| `expandedGroupIds` | `ReadonlySet<string>` | optional | Controlled groups. |
| `onExpandedGroupIdsChange` | `(ids: ReadonlySet<string>) => void` | optional | |
| `defaultExpandedGroupIds` | `ReadonlySet<string>` | optional | Uncontrolled initial. |
| `openerRef` | `RefObject<HTMLElement>` | optional | For focus return on overlay close. |
| `renderLink` | `(props: { href: string; className: string; children: ReactNode; isExternal?: boolean }) => ReactElement` | optional | Host wraps Next `Link`, etc. Default: `<a>`. |

### `DrawerShell`

Layout only: scrollable middle, footer slot, `children`. Props: `className`, `footer`, `header`, `contentClassName`.

### `DrawerOverlay`

Props: `isOpen`, `onOpenChange`, `children` (typically `DrawerShell`), `openerRef`, `className`, `scrimClassName`.

### `NavSectionLabel`

Props: `children` (string), `className`, `id` for `aria-labelledby` linkage if needed.

### `NavLinkRow`

Props: `id`, `label`, `href`, `icon`, `badge`, `isActive`, `isNested`, `density`, `onNavigate`, `renderLink`, `isExternal`.

### `NavCollapsibleGroup`

Props: `id`, `label`, `icon`, `isExpanded`, `onToggle`, `headerId`, `panelId`, `children` (child rows).

### `DrawerFooterAuth`

Props: `onLogin`, `onRegister`, `className`.

### `DrawerFooterUser`

Props: `user`, `onSettings`, `onLogout`, `className`.

---

## Active route matching

- Default: `match === 'exact'` → `currentPath === href`; `match === 'prefix'` → `currentPath.startsWith(href)` **and** `/` boundary rules to avoid `/reports` matching `/report`.
- Longest-prefix-wins if multiple items match (document algorithm in `matchActiveNavItem.ts`).
- Host may override with `isActiveHref`.

---

## Testing & documentation

### Unit / integration tests (Vitest + Testing Library)

- Toggle group updates `aria-expanded` and visibility (opacity / grid — assert **accessibility tree**, not animation internals).
- Keyboard: `Enter`/`Space` on group header toggles.
- `NavLinkRow` calls `onNavigate` / uses `renderLink`.
- Active state selection for exact vs prefix.
- Reduced motion: mock `matchMedia` and assert shortened durations via `getComputedStyle` or absence of transition class — keep assertions stable.

### Storybook

Minimum stories (design §8 + responsive/a11y):

1. Collapsed group.
2. Expanded group.
3. Nested group (depth 2).
4. Hover states (use pseudo-addon or Chromatic later — story args documenting className overrides acceptable).
5. Active link (luminous bar visible).
6. Footer guest vs footer authenticated.
7. **Overlay** vs **persistent** layout (viewport toolbar / globals).
8. Reduced motion mock.

Run **a11y** addon on drawer stories; fix contrast for `label-sm` on primary per design §6.

### README (`ui/system-design/drawer-navigation/README.md`)

- Installation, peer deps, controlled vs persistent usage, token prerequisites (`injectThemeCSSVariables` if required by app), example with `renderLink` for Next.js.

---

## Integration points (host app)

1. **Router**: Provide `currentPath`, `onNavigate`, and `renderLink` wrapping the framework link.
2. **Auth**: Session hook in app sets `isAuthenticated`, `user`, and wires `onLogin` / `onRegister` / `onLogout` / `onOpenSettings`.
3. **Layout**: At `≥1024px`, host uses grid with fixed column width **312px**; drawer `layout="persistent"`. Below breakpoint, `layout="overlay"`, `isOpen` tied to menu button.
4. **Opener**: Menu button ref passed as `openerRef` for focus restoration.

---

## Trade-offs

| Decision | Pros | Cons |
|----------|------|------|
| CSS-only motion | No new deps; smaller bundle | Complex height animations need grid `0fr/1fr` discipline |
| Controlled expansion | Predictable, testable | More boilerplate for host |
| No router coupling | Reusable across apps | Host must wire `renderLink` + path |
| `ui/system-design/` placement | Matches 28 existing DS packages | Diverges from older `packages/ui/` doc text |

---

## Recommendation

Ship **`@vassembly/ui-drawer-navigation`** under **`ui/system-design/drawer-navigation/`**, compose **`@vassembly/theme`**, **`@vassembly/ui-icons`**, **`@vassembly/ui-button`** (login), **`@vassembly/ui-text`**, and **`@vassembly/ui-utils`**, implement motion in **SCSS**, and keep auth/routing **strictly prop-driven**. Defer **72px icon rail** and **optional stagger** until a second iteration unless MVP scope explicitly includes them.

---

## Implementation steps (ordered)

1. **Scaffold package** — mirror `ui/system-design/modal` / `accordion`: `package.json`, `tsconfig`, eslint/tsconfig extends, `src/index.ts`, empty README.
2. **Types** — implement `src/types.ts` as the contract reviewed by host teams.
3. **Token + layout SCSS** — `DrawerShell` widths, surfaces, flex spacer, footer dock glass variant flag `footerVariant: 'solid' | 'glass'`.
4. **Primitives** — `NavSectionLabel`, `NavLinkRow`, `NavCollapsibleGroup` (grid collapse + chevron), then footers using `ui-button` / text link for register.
5. **Root composition** — `DrawerNavigation` wiring sections + matchers.
6. **Overlay** — scrim, slide, Escape, focus return; document z-index choice vs modal.
7. **Stories + tests** — achieve a11y addon pass on core stories.
8. **App integration (separate PR optional)** — wire into `apps/web` with layout breakpoint; add workspace dependency.

---

## Todo Plan

1. **`@vassembly/ui-drawer-navigation`** — [Type: new package / design-system UI]  
   - **Changes needed**: Scaffold package; add dependencies (`@vassembly/theme`, `@vassembly/ui-utils`, `@vassembly/ui-text`, `@vassembly/ui-button`, `@vassembly/ui-icons`, `react`, `react-dom`); implement components, SCSS, hooks, tests, stories, README.  
   - **Files to modify/create**: `ui/system-design/drawer-navigation/package.json`, `ui/system-design/drawer-navigation/tsconfig.json`, `ui/system-design/drawer-navigation/src/index.ts`, `ui/system-design/drawer-navigation/src/types.ts`, `ui/system-design/drawer-navigation/src/**/*.tsx`, `src/**/*.module.scss`, `src/**/*.test.tsx`, `src/**/*.stories.tsx`, `README.md`.  
   - **Suggested subagent workflow**: unit-test-writer → coder ↔ code-reviewer (max 2 loops) → documentation-writer.  
   - **Dependencies**: None.

2. **`@vassembly/theme`** — [Type: existing package — optional extension]  
   - **Changes needed**: Only if product requires **first-class light tokens** or shared **drawer z-index** token; otherwise **no change** in MVP.  
   - **Files to modify/create**: `ui/system-design/theme/src/tokens/*.scss` (as needed), theme README if new variables are public.  
   - **Suggested subagent workflow**: architect (ticket) → coder → code-reviewer.  
   - **Dependencies**: Product confirmation on light mode scope.

3. **`apps/web`** — [Type: app integration]  
   - **Changes needed**: Add workspace dependency; shell layout with breakpoint; connect auth hooks and router to `DrawerNavigation` props.  
   - **Files to modify/create**: `apps/web/package.json`, app layout / shell components (exact paths TBD in app).  
   - **Suggested subagent workflow**: coder → code-reviewer.  
   - **Dependencies**: Todo 1 complete (package published locally in workspace).

4. **`ui/storybook`** — [Type: existing Storybook app]  
   - **Changes needed**: **None expected** — glob already includes new stories; only touch if a global decorator (theme injection) is missing for drawer stories in practice.  
   - **Files to modify/create**: `ui/storybook/.storybook/preview.tsx` (only if required).  
   - **Suggested subagent workflow**: coder → Done.  
   - **Dependencies**: Todo 1.

---

## Document history

| Version | Date | Notes |
|---------|------|--------|
| 1 | 2026-04-16 | Initial architecture from design.md + librarian catalog pass. |
