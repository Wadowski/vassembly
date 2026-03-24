# Text Component — Architecture Plan

## Analysis

### Existing code audit

- **`ui/button`** (`/home/wadowski/Projects/vassembly/ui/button/`) — the direct structural template. Establishes all patterns to follow: `forwardRef`, CSS-module class maps, `types.ts`, `index.ts`, `.stories.tsx`, `.test.tsx`, `.module.scss.d.ts`.
- **`@vassembly/theme`** (`packages/theme/src/tokens/typography.scss`, `colors.scss`) — all typography and color tokens are already defined. Nothing new is needed in the theme package.
- **create-ui skill** (`/.cursor/skills/create-ui/SKILL.md`) — provides the scaffolding template at `.cursor/skills/create-ui/assets/template-empty/`. The coder must use this skill to bootstrap the package.

### What already exists

| Asset | Status |
|---|---|
| Typography SCSS tokens (font-family, size, weight, line-height, letter-spacing) | ✅ Fully defined in `@vassembly/theme` |
| Color tokens (`$color-text-primary/secondary/tertiary`) | ✅ Fully defined in `@vassembly/theme` |
| `forwardRef` component pattern | ✅ Established in `ui/button` |
| CSS-module class-map pattern (`VARIANT_MAP`) | ✅ Established in `ui/button` |
| Package scaffold (package.json, tsconfig, vitest.config) | ✅ Available via create-ui skill template |
| Test setup (@testing-library/react, jsdom, vitest) | ✅ Established in `ui/button` |

### What genuinely needs to be built

- `ui/text/` package (new, but scaffolded from existing template)
- `Text.tsx` component
- `Text.module.scss` (7 variant classes, base reset)
- `Text.module.scss.d.ts` (static type declarations)
- `types.ts` (`TextVariant`, `TextProps`)
- `Text.test.tsx`
- `Text.stories.tsx`
- `src/index.ts`

Nothing in any other package needs to change.

---

## Architecture & Package Placement

**Package**: `ui/text` → `@vassembly/ui-text`

This is a leaf-level UI package. It depends only on:
- `react` (peer)
- `@vassembly/theme` (workspace, SCSS tokens only)

No domain, service, or app package is touched. The package is entirely self-contained.

---

## Technical Decisions

### 1. Polymorphic element via `as` prop

The `as` prop is typed as `React.ElementType`. The rendered element is resolved at runtime from either `as` or the `DEFAULT_ELEMENT_MAP`.

The component uses `forwardRef<HTMLElement, TextProps>` — `HTMLElement` is the correct base type since the rendered element varies by variant. This matches the polymorphic use case and avoids an overly complex generic constraint.

```tsx
const Tag = (as ?? DEFAULT_ELEMENT_MAP[variant]) as React.ElementType;
return <Tag ref={ref} className={...} {...props}>{children}</Tag>;
```

### 2. CSS class composition (mirrors Button)

A `VARIANT_MAP` constant maps each variant name to its SCSS module class. The className is assembled by filtering and joining, identical to `Button.tsx`.

```tsx
const VARIANT_MAP: Record<TextVariant, string> = {
  h1:      styles.variantH1,
  h2:      styles.variantH2,
  h3:      styles.variantH3,
  body1:   styles.variantBody1,
  body2:   styles.variantBody2,
  label:   styles.variantLabel,
  caption: styles.variantCaption,
};
```

### 3. No margins or block layout from the component

The `.text` base class sets only `display: inline` and `margin: 0` (reset). All spacing is the consumer's responsibility.

### 4. SCSS: use token variables directly, no mixins

Each variant class sets properties individually using existing token variables (`$font-family-display`, `$font-size-display-md`, etc.). No new SCSS mixins are introduced. This matches the approach used in `Button.module.scss`.

### 5. `Text.module.scss.d.ts` — hand-authored static declaration

Matches the pattern of `Button.module.scss.d.ts`. Must list all CSS module class names exported by the SCSS file.

---

## File Structure

```
ui/text/
├── src/
│   ├── Text.tsx                   ← component implementation
│   ├── Text.module.scss           ← variant styles
│   ├── Text.module.scss.d.ts      ← static CSS module type declarations
│   ├── Text.stories.tsx           ← Storybook stories
│   ├── Text.test.tsx              ← Vitest unit tests
│   ├── types.ts                   ← TextVariant, TextProps
│   └── index.ts                   ← public exports
├── package.json                   ← @vassembly/ui-text
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Complete Specification Per File

### `types.ts`

```ts
import type React from 'react';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'label' | 'caption';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: React.ElementType;
  children: React.ReactNode;
}
```

### `Text.tsx`

```tsx
import { forwardRef } from 'react';
import styles from './Text.module.scss';
import type { TextProps, TextVariant } from './types';

const VARIANT_MAP: Record<TextVariant, string> = {
  h1:      styles.variantH1,
  h2:      styles.variantH2,
  h3:      styles.variantH3,
  body1:   styles.variantBody1,
  body2:   styles.variantBody2,
  label:   styles.variantLabel,
  caption: styles.variantCaption,
};

const DEFAULT_ELEMENT_MAP: Record<TextVariant, string> = {
  h1:      'h1',
  h2:      'h2',
  h3:      'h3',
  body1:   'p',
  body2:   'p',
  label:   'span',
  caption: 'span',
};

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ variant = 'body1', as, className, children, ...props }, ref) => {
    const Tag = (as ?? DEFAULT_ELEMENT_MAP[variant]) as React.ElementType;
    const textClassName = [styles.text, VARIANT_MAP[variant], className]
      .filter(Boolean)
      .join(' ');

    return (
      <Tag ref={ref} className={textClassName} {...props}>
        {children}
      </Tag>
    );
  },
);

Text.displayName = 'Text';
```

### `Text.module.scss`

```scss
@import '@vassembly/theme/src/tokens/index.scss';

.text {
  display: inline;
  margin: 0;
}

.variantH1 {
  font-family: $font-family-display;
  font-size: $font-size-display-md;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  letter-spacing: $letter-spacing-tight;
  color: $color-text-primary;
}

.variantH2 {
  font-family: $font-family-display;
  font-size: $font-size-heading-lg;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  letter-spacing: $letter-spacing-tight;
  color: $color-text-primary;
}

.variantH3 {
  font-family: $font-family-display;
  font-size: $font-size-heading-md;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  color: $color-text-primary;
}

.variantBody1 {
  font-family: $font-family-body;
  font-size: $font-size-body-md;
  font-weight: $font-weight-regular;
  line-height: $line-height-relaxed;
  color: $color-text-secondary;
}

.variantBody2 {
  font-family: $font-family-body;
  font-size: $font-size-body-sm;
  font-weight: $font-weight-regular;
  line-height: $line-height-relaxed;
  color: $color-text-secondary;
}

.variantLabel {
  font-family: $font-family-body;
  font-size: $font-size-label-md;
  font-weight: $font-weight-semibold;
  line-height: $line-height-normal;
  letter-spacing: $letter-spacing-tracked;
  text-transform: uppercase;
  color: $color-text-secondary;
}

.variantCaption {
  font-family: $font-family-body;
  font-size: $font-size-label-sm;
  font-weight: $font-weight-regular;
  line-height: $line-height-normal;
  color: $color-text-tertiary;
}
```

### `Text.module.scss.d.ts`

```ts
declare const classNames: {
  readonly text: string;
  readonly variantH1: string;
  readonly variantH2: string;
  readonly variantH3: string;
  readonly variantBody1: string;
  readonly variantBody2: string;
  readonly variantLabel: string;
  readonly variantCaption: string;
};

export default classNames;
```

### `index.ts`

```ts
export { Text } from './Text';
export type { TextProps, TextVariant } from './types';
```

---

## Stages 7–10 Assessment

| Stage | Required | Rationale |
|---|---|---|
| **7 — Tests** | ✅ Yes | Test-first: write Vitest tests using `@testing-library/react` before implementation. Cover: correct element rendering per variant, variant class applied, `as` prop overrides element, `className` merging, `forwardRef`, `displayName`. |
| **8 — Implementation** | ✅ Yes | Implement all files to pass the tests. Use the create-ui skill to scaffold the package, then fill in the implementation. |
| **9 — Code Review** | ✅ Yes | Review TypeScript correctness of the `as`/`forwardRef` pattern, SCSS token usage, and story coverage. |
| **10 — Documentation** | ✅ Yes | Update `README.md` with usage examples for all 7 variants, the `as` override pattern, and the `className` extension approach. |

---

## Todo Plan

### 1. `@vassembly/ui-text` — new package scaffold

- **Changes needed**: Bootstrap empty package using the create-ui skill template. Copy template from `.cursor/skills/create-ui/assets/template-empty/`, rename all `Component`→`Text` placeholders, update `package.json` name to `@vassembly/ui-text`.
- **Files to create**:
  - `ui/text/package.json`
  - `ui/text/tsconfig.json`
  - `ui/text/vitest.config.ts`
  - `ui/text/README.md`
  - `ui/text/src/index.ts`
  - `ui/text/src/types.ts` (placeholder)
  - `ui/text/src/Text.tsx` (placeholder)
  - `ui/text/src/Text.module.scss` (placeholder)
  - `ui/text/src/Text.module.scss.d.ts` (placeholder)
  - `ui/text/src/Text.stories.tsx` (placeholder)
- **Suggested subagent workflow**: `coder → Done`
- **Dependencies**: None

### 2. `@vassembly/ui-text` — test suite

- **Changes needed**: Write `Text.test.tsx` using Vitest + @testing-library/react following `ui/button/src/Button.test.tsx` patterns.
- **Test cases to cover**:
  - Each variant renders the correct default HTML element
  - Each variant applies the correct CSS module class to the element
  - `as` prop overrides the rendered element without changing the variant class
  - `className` prop is merged with variant class
  - `children` are rendered correctly
  - `forwardRef` forwards the ref to the root DOM element
  - `displayName` is `'Text'`
  - Native HTML attributes (`aria-label`, `id`, `data-testid`) are spread through
- **Files to modify/create**: `ui/text/src/Text.test.tsx`
- **Suggested subagent workflow**: `tdd-unit-test-writer → Done`
- **Dependencies**: Todo 1 (package scaffold must exist)

### 3. `@vassembly/ui-text` — implementation

- **Changes needed**: Implement all production files to pass the tests from Todo 2.
- **Files to modify/create**:
  - `ui/text/src/types.ts`
  - `ui/text/src/Text.tsx`
  - `ui/text/src/Text.module.scss`
  - `ui/text/src/Text.module.scss.d.ts`
  - `ui/text/src/Text.stories.tsx`
  - `ui/text/src/index.ts`
- **Suggested subagent workflow**: `coder ↔ code-reviewer (loop: max 2 iterations) → Done`
- **Dependencies**: Todo 2 (tests must be written first)

### 4. `@vassembly/ui-text` — documentation

- **Changes needed**: Update `README.md` with full usage documentation.
- **Content**: Package install, all 7 variants with code examples, `as` prop override examples, `className` extension example, prop reference table.
- **Files to modify**: `ui/text/README.md`
- **Suggested subagent workflow**: `documentation-writer → Done`
- **Dependencies**: Todo 3 (implementation must be complete)
