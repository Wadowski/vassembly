# @vassembly/ui-text

Typographic primitive for the Vassembly design system. Renders text with variant-driven styling — font, size, weight, line-height, and default color are all determined by the `variant` prop. Layout is always the consumer's responsibility.

## Installation

```bash
pnpm add @vassembly/ui-text
```

## Usage

```tsx
import { Text } from '@vassembly/ui-text';

<Text variant="h1">Page Title</Text>
<Text variant="body1">Paragraph content goes here.</Text>
<Text variant="label">Category</Text>
```

## Variants

| Variant | Default element | Font | Size | Weight | Default color |
|---|---|---|---|---|---|
| `h1` | `<h1>` | Space Grotesk | 2.8rem | Bold | `$color-text-primary` |
| `h2` | `<h2>` | Space Grotesk | 2rem | Bold | `$color-text-primary` |
| `h3` | `<h3>` | Space Grotesk | 1.5rem | Semibold | `$color-text-primary` |
| `body1` | `<p>` | Inter | 1rem | Regular | `$color-text-secondary` |
| `body2` | `<p>` | Inter | 0.875rem | Regular | `$color-text-secondary` |
| `label` | `<span>` | Inter | 0.8125rem | Semibold, uppercase | `$color-text-secondary` |
| `caption` | `<span>` | Inter | 0.75rem | Regular | `$color-text-tertiary` |

Default variant is `body1`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'h1' \| 'h2' \| 'h3' \| 'body1' \| 'body2' \| 'label' \| 'caption'` | `'body1'` | Controls typography style |
| `as` | `React.ElementType` | variant default | Override the rendered HTML element without changing the visual style |
| `children` | `ReactNode` | — | Text content |
| `className` | `string` | — | Additional CSS classes merged onto the root element |

All standard HTML attributes are forwarded to the rendered element (`id`, `aria-*`, `data-*`, event handlers, etc.).

## Examples

### All variants

```tsx
<Text variant="h1">Page headline</Text>
<Text variant="h2">Section heading</Text>
<Text variant="h3">Card title</Text>
<Text variant="body1">Primary body text for descriptions and prose.</Text>
<Text variant="body2">Secondary body text, slightly smaller.</Text>
<Text variant="label">Category Header</Text>
<Text variant="caption">Last updated 2 minutes ago</Text>
```

### Overriding the rendered element with `as`

The `as` prop lets you change the semantic HTML element without affecting the visual style. This is useful for correct heading hierarchy or for wiring form labels.

```tsx
{/* Visually h1 style, but semantically an h2 for correct document outline */}
<Text variant="h1" as="h2">Page Title</Text>

{/* Label variant used as an actual <label> element */}
<Text variant="label" as="label" htmlFor="email-input">
  Email address
</Text>

{/* Heading style inside an inline context */}
<Text variant="h3" as="span">Inline heading</Text>
```

### Extending styles via `className`

Default colors and styles can be overridden by passing a `className`.

```tsx
<Text variant="body1" className={styles.highlight}>
  Highlighted body text
</Text>
```

### Forwarding refs

```tsx
const ref = React.createRef<HTMLElement>();

<Text ref={ref} variant="h2">
  Ref target
</Text>
```

## Accessibility

- `h1`–`h3` variants render semantic heading elements by default. Ensure correct heading hierarchy using the `as` prop when needed.
- The `label` variant applies `text-transform: uppercase` via CSS only — screen readers read the natural-case text.
- The `label` variant defaults to `<span>`. For form field labels, use `as="label"` and wire `htmlFor` to the associated input.
- All `aria-*` attributes are forwarded to the root element.
