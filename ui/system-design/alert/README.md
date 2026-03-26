# @vassembly/ui-alert

### 1. Package Description

Alert UI component for the Vassembly design system. Presents a message in a variant-styled container with optional icons, optional supporting details, and optional collapsible details.

### 2. Exports & API

## Exports

### `Alert(props: AlertProps): JSX.Element`

```tsx
import { Alert } from '@vassembly/ui-alert';

export function Example(): JSX.Element {
  return (
    <Alert
      message="Your profile was updated."
      variant="success"
      showIcon
      details="Changes apply on your next sign-in."
      isCollapsible
    />
  );
}
```

### `AlertProps` / `AlertVariant`

Types for the component and for the `variant` prop (`info` | `success` | `warning` | `error`).

## Installation

```bash
pnpm add @vassembly/ui-alert
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | `ReactNode` | — | Primary message (strings are rendered with `Text` body1) |
| `variant` | `AlertVariant` | `'info'` | Semantic style: `info`, `success`, `warning`, `error` |
| `showIcon` | `boolean` | `false` | When true, shows `icon` or the default icon for the variant |
| `icon` | `ReactNode` | — | Custom icon when `showIcon` is true |
| `details` | `ReactNode` | — | Supporting content below the message (strings use `Text` body2) |
| `isCollapsible` | `boolean` | `false` | When true and `details` is set, details expand/collapse; message stays visible |
| `defaultIsExpanded` | `boolean` | `true` | Initial expanded state when uncontrolled |
| `isExpanded` | `boolean` | — | Controlled expanded state (requires `onExpandedChange` to update) |
| `onExpandedChange` | `(isExpanded: boolean) => void` | — | Called when the collapsible section toggles |
| `className` | `string` | — | Optional class on the root element |

## Behavior

- Root uses `role="alert"` for `warning` and `error`, and `role="status"` for `info` and `success`.
- Collapsible UI appears only when both `isCollapsible` and `details` are set.
- The toggle control exposes `aria-expanded` and `aria-controls` for the details region.

## Accessibility

- Live regions use `alert` / `status` roles consistent with snackbar semantics for warnings and errors.
- The collapsible control includes visible “Show details” / “Hide details” labels plus a decorative chevron.
