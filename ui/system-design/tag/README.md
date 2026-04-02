# @vassembly/ui-tag

## 1. Package Description

Tag UI component for Vassembly design system.

## 2. Exports & API

### `Tag(props: TagProps): JSX.Element`

Renders a styled tag (chip) with optional left icon and optional removable close button.

```tsx
import { Tag } from '@vassembly/ui-tag';

export function Example(): JSX.Element {
  return <Tag variant="primary">New</Tag>;
}
```

## 3. Installation

```bash
pnpm add @vassembly/ui-tag
```

## 4. Usage

### With icon

```tsx
import { Tag } from '@vassembly/ui-tag';

export function ExampleWithIcon(): JSX.Element {
  return (
    <Tag icon={<span aria-hidden="true">#</span>} variant="success">
      Trending
    </Tag>
  );
}
```

### Removable tag

```tsx
import { Tag } from '@vassembly/ui-tag';

export function ExampleRemovable(): JSX.Element {
  return (
    <Tag variant="warning" onRemove={() => {}}>
      Temporary
    </Tag>
  );
}
```

## 5. Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Tag content |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'default'` | Controls styling |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Visual size |
| `icon` | `ReactNode` | — | Optional icon rendered to the left |
| `onRemove` | `() => void` | — | When provided, renders a remove button |
| `removeLabel` | `string` | `'Remove'` | `aria-label` for the remove button |
| `className` | `string` | — | Optional extra class for the root element |

## 6. Accessibility

- Uses a real `<button type="button">` for the remove control when `onRemove` is provided.
- The remove button has `aria-label` set to `removeLabel` (default: `Remove`).

