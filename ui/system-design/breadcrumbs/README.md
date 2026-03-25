# @vassembly/ui-breadcrumbs

## Description
Breadcrumbs UI component for Vassembly design system.

## Installation
```bash
pnpm add @vassembly/ui-breadcrumbs
```

## Usage
```tsx
import { Breadcrumbs } from '@vassembly/ui-breadcrumbs';

export function Example(): JSX.Element {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Components', href: '/components' },
        { label: 'Breadcrumbs' },
      ]}
    />
  );
}
```

## Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BreadcrumbItem[]` | — | Breadcrumb items to render in order |
| `separator` | `string` | `'/'` | Separator shown between adjacent items |

## Accessibility Notes
- The component renders a wrapper `nav` with `aria-label="breadcrumb"`.
- Breadcrumb items are rendered inside an `ol` with `li` entries.
- Non-last items with `href` render as links; non-last items without `href` render as plain text.
- The last item always renders as plain text with `aria-current="page"`.
- Separators are rendered as `span` elements with `aria-hidden="true"`.

## Examples
### Default separator
```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: 'Breadcrumbs', href: '/components/breadcrumbs' },
  ]}
/>
```

### Custom separator
```tsx
<Breadcrumbs
  separator=">"
  items={[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: 'Breadcrumbs' },
  ]}
/>
```

