# Footer UI component (`@vassembly/ui-footer`) — architecture

## Classification

**Product task** — new reusable design-system surface with defined layout, typography, and interaction behavior. Deliverable is a package under `ui/system-design/footer/` consumed by apps (e.g. `apps/web` layout).

---

## 1. Component architecture and structure

### Root responsibility

- **Single exported root** (e.g. `Footer`) owns semantic landmark `<footer>`, optional `aria-labelledby` when a visible heading exists, and the **responsive shell** (CSS grid: four tracks on desktop, one column on small viewports).
- **Composition over configuration** for optional blocks: either **typed optional props** (each section receives structured data) or **optional render props / `ReactNode` slots** for Brand and Social where markup varies most. Prefer **structured props for link columns** (sitemap, company/legal) for consistency with `AnchorList`-style patterns, and **slots or minimal typed arrays** for brand logo and social icon rows to avoid forcing every consumer through the same DOM.

### Internal subsections (package-private)

| Subsection | Role | Notes |
|------------|------|--------|
| **Brand** | Optional logo/name/tagline | Slot or `{ logo, title?, description? }`; no new `@vassembly/ui-brand` required for v1. |
| **Site map** | Nav column of links | Mirror `anchor-list` semantics (`nav` + list); reuse **Text** + anchors, not a new Link package. |
| **Company / legal** | Second link column | Same pattern as site map; may share a small internal **FooterLinkColumn** (not exported) to avoid duplicating list markup/SCSS. |
| **Contact** | Address, email, phone as structured text/links | Prefer **Text** variants + plain `<a href="mailto:">` / `tel:` for a11y. |
| **Social** | Icon buttons/links | Compose **`@vassembly/ui-icons`** social exports; treat as **external list** in props so the package does not hard-code which networks. |
| **Copyright** | Single line / rich text | **Text** or plain paragraph with token typography. |

### Ordering (mobile vs desktop)

- **One DOM order** with **CSS `order`** (flex/grid) or **grid placement** to achieve “reordered sections on mobile” without duplicate content (SEO and a11y). Architecturally: define **canonical DOM order** (e.g. brand → sitemap → company → contact → social → copyright) and **token-driven reorder** for `$media-mobile-only` to match the design spec’s mobile sequence.

### Cross-cutting

- **`resolveClassName`** from `@vassembly/ui-utils` on the root and any optional `className` pass-through (same as breadcrumbs and peers).

---

## 2. Props / types interface (conceptual)

Design the public API to stay **stable** and **tree-shakeable** (`import type` for consumers).

### Recommended shape (conceptual only)

- **`className?: string`** — merged on root.
- **`id?: string`** — for skip links / anchors.
- **`brand?: ReactNode | BrandSectionProps`** — optional; union or overload documented in README.
- **`siteMap?: FooterNavColumnProps`** — `{ heading: string; links: readonly FooterLinkItem[] }`.
- **`company?: FooterNavColumnProps`** — same shape; optional second column.
- **`legal?: FooterNavColumnProps`** — if design separates legal from company, either a third column prop or merge into `company` with a subheading pattern; **prefer separate props** only if layout truly splits them (four columns).
- **`contact?: ContactSectionProps`** — structured fields (`lines`, `email`, `phone`, etc.) or `ReactNode` if locales need arbitrary markup.
- **`social?: readonly SocialLinkItem[]`** — each item: `{ href, label, icon: IconComponent }` or icon name enum mapped inside package; **label required** for a11y (`aria-label` on icon-only controls).
- **`copyright: string | ReactNode`** — required for predictable legal line; can be plain string for most apps.

### Shared supporting types (conceptual)

- **`FooterLinkItem`**: `{ href: string; label: string; external?: boolean }` — if `external`, render `rel="noopener noreferrer"` where appropriate.
- **`FooterNavColumnProps`**: heading + links (readonly).
- **`SocialLinkItem`**: href, accessible name, icon reference.

### Non-goals for v1 API

- No routing integration (React Router `Link`); **`<a href>`** only — matches existing anchor-list pattern; apps can pass absolute URLs.
- No i18n inside the component; consumers pass translated strings.

---

## 3. File organization for the package

Align with **`ui/system-design/breadcrumbs/`** and **`ui/system-design/anchor-list/`**:

| Path | Purpose |
|------|---------|
| `ui/system-design/footer/package.json` | `name`: `@vassembly/ui-footer`; deps below. |
| `ui/system-design/footer/tsconfig.json` | Extend `@vassembly/typescript-config`. |
| `ui/system-design/footer/vitest.config.ts` | Colocated tests. |
| `ui/system-design/footer/README.md` | Props, a11y, tokens, Inter/`--font-family-body` consumer note. |
| `ui/system-design/footer/src/index.ts` | Named exports: component + types. |
| `ui/system-design/footer/src/Footer.tsx` | Root composition. |
| `ui/system-design/footer/src/types.ts` | Public prop interfaces (per repo rules: object params destructure, explicit return types). |
| `ui/system-design/footer/src/Footer.module.scss` | Grid, surfaces, link hovers, responsive order. |
| `ui/system-design/footer/src/Footer.module.scss.d.ts` | If peer packages keep it. |
| `ui/system-design/footer/src/Footer.stories.tsx` | CSF3; title `System Design/Footer`. |
| `ui/system-design/footer/src/Footer.test.tsx` | Vitest + Testing Library. |

**Optional split** (only if files exceed ~100 lines per workspace rule): extract `FooterLinkColumn.tsx` + narrow SCSS partials; keep public API in `Footer.tsx` + `index.ts`.

---

## 4. Dependencies

### Runtime (`dependencies`)

| Package | Rationale |
|---------|-----------|
| `@vassembly/theme` | SCSS token import path used across system-design (`@import '@vassembly/theme/src/tokens/index.scss'`). |
| `@vassembly/ui-text` | Headings, body, captions for columns and copyright. |
| `@vassembly/ui-utils` | `resolveClassName`. |
| `@vassembly/ui-icons` | Social icons (select exports per story/consumer; tree-shaking friendly if imports are per-icon). |
| `react` / `react-dom` | Peer-style workspace range consistent with breadcrumbs. |

### Dev (`devDependencies`)

- `sass`, `vitest`, `@vitejs/plugin-react`, Testing Library packages, `@vassembly/eslint-config`, `@vassembly/typescript-config`, Storybook packages — **mirror `ui/system-design/breadcrumbs/package.json`** as the template baseline.
- **Version alignment note (from librarian):** `ui/storybook` uses Storybook 10 while many component packages list Storybook 7 in devDependencies; stories are still discovered via glob. **Decision for implementation:** match **breadcrumbs** for the new package’s devDependencies unless a repo-wide upgrade is in scope; accept divergence with root Storybook until standardized.

### Workspace / Storybook

- **`ui/storybook`**: no new dependency required for story discovery — `ui/storybook/.storybook/main.ts` globs `ui/**/src/**/*.stories.*`.
- **pnpm workspace**: ensure `ui/system-design/footer` is included if the workspace uses explicit globs (verify root `pnpm-workspace.yaml` when implementing).

---

## 5. Key implementation considerations

### Responsive behavior

- Use **`$breakpoint-desktop`**, **`$media-desktop`**, **`$media-mobile-only`** from `ui/system-design/theme/src/tokens/breakpoints.scss`.
- **Desktop:** CSS Grid with four columns; map sections to areas (Brand may span or sit in column 1 per design).
- **Mobile:** single column; **`grid-template-areas` or `order`** on wrapper elements for section reorder without duplicating nodes.

### Reusable subsections

- **Internal-only** small components for repeated “heading + link list” and “heading + body text” reduce duplication; **do not publish** separate packages until a second consumer needs them (librarian: no shared grid/link package today).

### Styling approach

- **SCSS modules** only; first line pattern: token `index.scss` import (same as breadcrumbs).
- **Surfaces:** `$color-surface`, `$color-surface-container-*`, text color tokens from `colors.scss` for tonal dark footer (no ad-hoc hex).
- **Typography:** `$font-family-body` from `typography.scss` (Inter stack + `var(--font-family-body)`); size/weight tokens aligned with design (body sm/md, caption if needed).
- **Interactive states:** link hover/focus using **primary/secondary** token variables already used in breadcrumbs/anchor-list hover patterns — **reuse the same token variables**, not new semantic names.
- **Social icons:** icon color default + hover state in SCSS targeting the anchor/button wrapper; respect **focus-visible** outlines for keyboard users.

### Accessibility

- One `<footer>` per page (document in README — consumer responsibility).
- **Headings:** use proper level (e.g. `h2` or `h3` via `Text as=`) per page outline; stories should show a sensible default.
- **Nav landmarks:** `aria-label` on each `nav` when multiple navs exist (sitemap vs legal).
- **External links:** optional prop to add screen-reader hint or icon (if design requires; otherwise keep minimal).

### Theme TS vs SCSS (gap)

- Librarian noted **`@vassembly/theme` README documents TS APIs** but **`theme/src/` currently shows SCSS tokens + stories only** — no `index.ts` in tree. **Footer v1 should rely on SCSS tokens only** for colors/typography/spacing. If runtime TS theme is needed later, that is a **separate theme package fix**, not a blocker for the footer package.

### Inter / font variable

- **Consumers** must set `--font-family-body` (pattern: `apps/web/app/layout.tsx` with `next/font/google` Inter). Document in README so Storybook and apps apply the same variable for visual parity with typography tokens.

---

## 6. Testing strategy

### Unit / component tests (Vitest + Testing Library)

- **Rendering:** footer renders when only `copyright` (and minimal required props) provided; optional sections omitted without empty headings.
- **Accessibility:** landmark `footer`; nav regions have distinct accessible names when multiple columns present; social links expose accessible names.
- **Links:** correct `href`, optional `rel` for external URLs.
- **No snapshot sprawl:** assert roles, labels, and key text — black-box style per project testing standards.

### Stories (Storybook)

- **Full:** all sections populated, realistic link counts.
- **Minimal:** copyright + one column (smoke for layout collapse).
- **Mobile viewport** story or global viewports: visual check for column stack and order (complements CSS tests if needed).
- **Dark tonal background:** verify against token-backed background (visual regression optional if repo adds Chromatic later).

### What not to test

- Internal CSS class names; pixel-perfect layout (unless screenshot tooling exists).

---

## 7. Integration with design system tokens and components

| Integration | Mechanism |
|-------------|-----------|
| Colors / spacing / radii / shadows | `@vassembly/theme` SCSS tokens in `Footer.module.scss`. |
| Typography / Inter stack | Typography SCSS variables + consumer-provided `--font-family-body`. |
| Body copy / titles | `@vassembly/ui-text` `Text` with appropriate `variant` and `as`. |
| Icons | `@vassembly/ui-icons` — import only needed social icons per consumer or story. |
| Class names | `@vassembly/ui-utils` `resolveClassName`. |
| Storybook | Stories under `src/`; global SCSS `additionalData` in Storybook main config already prepends tokens for modules. |

---

## 8. Steps to maximize code reuse

1. **Scaffold** with `create-ui` skill **adapted to actual path** `ui/system-design/footer/` (skill text references `ui/{name}/`; implementation must follow existing **`ui/system-design/<name>/`** convention).
2. **Copy package.json / tsconfig / vitest patterns** from `ui/system-design/breadcrumbs/` (scripts, eslint/tsconfig extends, dependency set minus icons if adding icons only for social).
3. **Read SCSS** in `ui/system-design/breadcrumbs/` and `ui/system-design/anchor-list/` for **token imports, link hover/focus, nav/list structure** — mirror patterns, do not invent new color variables.
4. **Compose `Text`** for all typographic content in columns and copyright.
5. **Use `anchor-list` as UX reference** for vertical link lists (semantic `nav` + list) without taking a hard dependency on `@vassembly/ui-anchor-list` unless the API fits without prop explosion; **default: no dependency** — copy semantic pattern only to keep footer package focused and avoid style leakage from anchor-list’s own module classes.
6. **Social row:** only **`@vassembly/ui-icons`** + footer SCSS; no new icon wrapper package.
7. **Post-build integration:** add `@vassembly/ui-footer` to **`apps/web`** root layout when product is ready (web already uses theme + Inter variable); **`apps/docs`** remains optional until theme/fonts are wired like web.

---

## Analysis (consolidated)

- **Domains / services:** none; pure presentation package.
- **Existing reuse:** tokens, typography tokens, `Text`, `resolveClassName`, social icons, Storybook glob, web font variable pattern.
- **Partial / patterns only:** anchor-list and breadcrumbs for structure and SCSS interaction patterns — **not** necessarily package dependencies.
- **Genuinely new:** responsive four-column shell, section composition API, footer-specific SCSS (grid + mobile order), stories and tests.
- **New packages:** only `@vassembly/ui-footer` — **no** new domain, service, or extra UI package unless link extraction is deferred (recommended defer).

---

## Architecture and package placement

- **Location:** `ui/system-design/footer/` — correct per monorepo UI category (`ui/system-design/*` single-component packages).
- **Data flow:** Apps pass **serializable / translated** content into props; no fetch inside footer; no business rules.
- **Dependencies:** Acyclic — footer depends on theme, text, utils, icons; none of those should depend on footer.

---

## Recommendation

**Ship a single `@vassembly/ui-footer` package** that composes existing primitives and SCSS tokens, with **structured props for nav columns** and **flexible brand/social** inputs. **Do not** add `@vassembly/ui-link` or `@vassembly/ui-grid` in v1 — extract only if a second component duplicates the same anchor/grid logic. **Scope theme TS** to follow-up if apps need programmatic token access; footer uses SCSS only.

**Trade-offs:** Slightly more props surface vs maximum flexibility — favors predictable layout and a11y. Optional internal `FooterLinkColumn` keeps files under line limits without publishing new packages.

---

## Implementation steps (ordered)

1. Scaffold `ui/system-design/footer` from breadcrumbs/anchor-list + create-ui template, set `name` to `@vassembly/ui-footer`.
2. Define `types.ts` public interfaces (sections, links, social items).
3. Implement `Footer.tsx` + `Footer.module.scss` (grid, breakpoints, tonal surface, link/social states).
4. Add `Footer.stories.tsx` (full, minimal, mobile-focused).
5. Add `Footer.test.tsx` (render, a11y, links, optional sections).
6. Write `README.md` (props, Inter/`--font-family-body`, one-footer-per-page, Storybook title).
7. Wire consumer: **`apps/web`** `app/layout.tsx` (or shared layout) — **separate todo** after package publish in workspace.
8. Optionally align Storybook/Vitest versions across `ui/system-design/*` in a **tech-debt** pass (not blocking footer).

---

## Todo plan

1. **`@vassembly/ui-footer` (new package)** — Type: new UI package (scaffold + implementation)
   - **Changes needed:** Create package at `ui/system-design/footer/` following breadcrumbs structure; implement Footer component, SCSS, types, stories, tests, README.
   - **Files to modify/create:** `ui/system-design/footer/package.json`, `tsconfig.json`, `vitest.config.ts`, `README.md`, `src/index.ts`, `src/Footer.tsx`, `src/types.ts`, `src/Footer.module.scss`, `src/Footer.module.scss.d.ts` (if used), `src/Footer.stories.tsx`, `src/Footer.test.tsx`.
   - **Suggested subagent workflow:** coder (scaffold) → unit-test-writer + coder (tests + component) ↔ code-reviewer (max 2) → documentation-writer (README).
   - **Dependencies:** None (greenfield package).

2. **`pnpm-workspace.yaml` (root)** — Type: workspace config (if required)
   - **Changes needed:** Only if footer path is not already covered by workspace globs.
   - **Files to modify/create:** `pnpm-workspace.yaml`.
   - **Suggested subagent workflow:** coder → Done.
   - **Dependencies:** None or parallel with todo 1 (verify early).

3. **`@vassembly/web` (`apps/web`)** — Type: app integration (optional follow-up)
   - **Changes needed:** Add dependency on `@vassembly/ui-footer`; render footer in root layout with real content props.
   - **Files to modify/create:** `apps/web/package.json`, layout under `apps/web/app/`.
   - **Suggested subagent workflow:** coder → code-reviewer.
   - **Dependencies:** Todo 1 complete.

4. **`@vassembly/theme`** — Type: technical follow-up (optional)
   - **Changes needed:** Reconcile README / `package.json` `main` with actual `src` TS entry if consumers need TS theme API; **not required** for footer SCSS-only approach.
   - **Suggested subagent workflow:** architect/coder as separate ticket.
   - **Dependencies:** None.

---

## Librarian consultation summary

Consulted librarian: existing templates **`breadcrumbs`**, **`anchor-list`**, **`text`**; tokens in **`@vassembly/theme`** SCSS; **`@vassembly/ui-icons`** for social; **`@vassembly/ui-utils`** for class merging; **no** existing footer or link/grid packages; **`apps/web`** natural consumer; **`ui/storybook`** picks up stories via glob; **gaps:** footer shell and composition are new; theme TS surface may be inconsistent with README — footer should use SCSS tokens for v1.
