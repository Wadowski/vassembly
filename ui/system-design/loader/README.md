# @vassembly/ui-loader

### 1. Package Description

Loader UI component for the Vassembly design system. Renders an inline spinner with `role="status"` and either a default or custom accessible label.

### 2. Exports & API

## Exports

### `Loader(props: LoaderProps): JSX.Element`

```tsx
import { Loader } from '@vassembly/ui-loader';

export function DefaultExample(): JSX.Element {
  return <Loader />;
}

export function WithLabelExample(): JSX.Element {
  return <Loader>Submitting your response</Loader>;
}
```

### `LoaderProps`

Props type for the `Loader` component.

## Installation

```bash
pnpm add @vassembly/ui-loader
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | `string` | — | When there are no `children`, sets the root `aria-label`. If omitted, the default is `"Loading"`. Ignored when `children` are present (label comes from `children` via `aria-labelledby`). |
| `children` | `ReactNode` | — | Optional status text: rendered in a visually hidden span and referenced by `aria-labelledby` on the root. |
| `className` | `string` | — | Optional root class name |
| *(inherited)* | `HTMLAttributes<HTMLDivElement>` | — | Standard `div` attributes are forwarded, except `role`, `aria-label`, and `children` (the latter two are modeled by `LoaderProps` as above). |

## Behavior

- The spinner uses a CSS keyframe animation (`loader-spin`).
- Under `prefers-reduced-motion: reduce`, the spinner animation is disabled and the ring uses a static, high-contrast style.

## Accessibility

- Root uses `role="status"`.
- Without `children`, the root has `aria-label={ariaLabel ?? 'Loading'}`.
- With `children`, the root uses `aria-labelledby` pointing to a visually hidden span that contains the children; the decorative spinner has `aria-hidden`.
