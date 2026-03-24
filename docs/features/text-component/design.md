# Text Component — Design Specification

## 1. Design Rationale

The `Text` component is the typographic foundation of the vassembly design system. It surfaces the typography scale already defined in `@vassembly/theme` as a single, ergonomic React primitive.

The "Synthetic Luminal" design direction treats typography as a functional signal layer — each variant communicates hierarchy and intent, not just size. Space Grotesk carries authority for heading levels (`h1`–`h3`); Inter handles precision for body, labels, and captions.

Because layout is always the consumer's responsibility, `Text` renders inline by default and does not impose block flow, margins, or padding. All typographic rhythm comes from tokens, not from component internals.

---

## 2. Variant Specifications

Each variant maps to a set of typography tokens. Color is a separate concern and maps to a semantic text token.

### 2.1 `h1`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-display-md` |
| Font family     | Space Grotesk |
| Font size       | `2.8rem` (`$font-size-display-md`) |
| Font weight     | `700` (`$font-weight-bold`) |
| Line height     | `1.2` (`$line-height-tight`) |
| Letter spacing  | `-0.01em` (`$letter-spacing-tight`) |
| Default color   | `$color-text-primary` (`#e5e5e7`) |
| Default element | `h1` |

Usage: Page-level titles, hero headlines, welcome states. One per page.

---

### 2.2 `h2`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-heading-lg` |
| Font family     | Space Grotesk |
| Font size       | `2rem` (`$font-size-heading-lg`) |
| Font weight     | `700` (`$font-weight-bold`) |
| Line height     | `1.2` (`$line-height-tight`) |
| Letter spacing  | `-0.01em` (`$letter-spacing-tight`) |
| Default color   | `$color-text-primary` (`#e5e5e7`) |
| Default element | `h2` |

Usage: Major section headings, feature titles.

---

### 2.3 `h3`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-heading-md` |
| Font family     | Space Grotesk |
| Font size       | `1.5rem` (`$font-size-heading-md`) |
| Font weight     | `600` (`$font-weight-semibold`) |
| Line height     | `1.2` (`$line-height-tight`) |
| Letter spacing  | `0` |
| Default color   | `$color-text-primary` (`#e5e5e7`) |
| Default element | `h3` |

Usage: Card titles, panel headers, sub-section headings.

---

### 2.4 `body1`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-body-md` |
| Font family     | Inter |
| Font size       | `1rem` (`$font-size-body-md`) |
| Font weight     | `400` (`$font-weight-regular`) |
| Line height     | `1.75` (`$line-height-relaxed`) |
| Letter spacing  | `0` |
| Default color   | `$color-text-secondary` (`#a8a8ac`) |
| Default element | `p` |

Usage: Primary prose, descriptions, explanatory text.

---

### 2.5 `body2`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-body-sm` |
| Font family     | Inter |
| Font size       | `0.875rem` (`$font-size-body-sm`) |
| Font weight     | `400` (`$font-weight-regular`) |
| Line height     | `1.75` (`$line-height-relaxed`) |
| Letter spacing  | `0` |
| Default color   | `$color-text-secondary` (`#a8a8ac`) |
| Default element | `p` |

Usage: Secondary body copy, supporting text, sidebar content, compact descriptions.

---

### 2.6 `label`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-label-md` |
| Font family     | Inter |
| Font size       | `0.8125rem` (`$font-size-label-md`) |
| Font weight     | `600` (`$font-weight-semibold`) |
| Line height     | `1.5` (`$line-height-normal`) |
| Letter spacing  | `0.1em` (`$letter-spacing-tracked`) |
| Text transform  | `uppercase` |
| Default color   | `$color-text-secondary` (`#a8a8ac`) |
| Default element | `span` |

Usage: Form field labels, category headers, section dividers, "technical readout" aesthetics. CSS-only uppercase — accessible name is read in natural case by screen readers.

---

### 2.7 `caption`

| Property        | Value |
|-----------------|-------|
| Token           | `$typography-label-sm` |
| Font family     | Inter |
| Font size       | `0.75rem` (`$font-size-label-sm`) |
| Font weight     | `400` (`$font-weight-regular`) |
| Line height     | `1.5` (`$line-height-normal`) |
| Letter spacing  | `0` |
| Default color   | `$color-text-tertiary` (`#7a7a80`) |
| Default element | `span` |

Usage: Metadata, timestamps, image captions, helper text, secondary annotations.

---

## 3. Component API

```tsx
interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'label' | 'caption';
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  // + native HTML attributes spread onto the rendered element
}
```

- `variant` defaults to `'body1'`
- `as` overrides the rendered HTML element without changing visual style
- `className` forwarded to root element for consumer overrides
- All other native HTML attributes are spread onto the rendered element

---

## 4. Default Element Map

| Variant   | Default element |
|-----------|----------------|
| `h1`      | `h1`           |
| `h2`      | `h2`           |
| `h3`      | `h3`           |
| `body1`   | `p`            |
| `body2`   | `p`            |
| `label`   | `span`         |
| `caption` | `span`         |

---

## 5. Rendering Behavior

- The component renders inline by default — no layout forcing on the consumer.
- No margins, padding, or block-level layout are applied by the component.
- Default colors are applied in CSS via tokens; consumer can override via `className` (no `color` prop).

---

## 6. Accessibility Notes

- `h1` defaults to `<h1>` — only one per page; consumers are responsible for heading hierarchy.
- `label` variant uses `text-transform: uppercase` in CSS only. Screen readers read the natural-case text.
- `label` variant defaults to `<span>`, not `<label>`. For form field labels, consumers must pass `as="label"` and wire `htmlFor`.
- All elements support `aria-*` attributes via prop spreading.

---

## 7. Developer Handoff

### SCSS module structure

```scss
@import '@vassembly/theme/src/tokens/index.scss';

.text {
  /* base reset — no margins, inline display */
}

/* Per-variant classes applied via a VARIANT_MAP */
.variantH1      { ... }
.variantH2      { ... }
.variantH3      { ... }
.variantBody1   { ... }
.variantBody2   { ... }
.variantLabel   { ... }
.variantCaption { ... }
```

### Component rendering pattern (mirrors Button)

```tsx
const VARIANT_MAP = {
  h1:      styles.variantH1,
  h2:      styles.variantH2,
  h3:      styles.variantH3,
  body1:   styles.variantBody1,
  body2:   styles.variantBody2,
  label:   styles.variantLabel,
  caption: styles.variantCaption,
};

const DEFAULT_ELEMENT_MAP = {
  h1:      'h1',
  h2:      'h2',
  h3:      'h3',
  body1:   'p',
  body2:   'p',
  label:   'span',
  caption: 'span',
};
```

The component uses `forwardRef`. The `as` prop is typed as `React.ElementType`.

### File structure (mirrors `ui/button`)

```
ui/text/
  src/
    Text.tsx
    Text.module.scss
    Text.module.scss.d.ts    ← generated
    Text.stories.tsx
    Text.test.tsx
    types.ts
    index.ts
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
```
