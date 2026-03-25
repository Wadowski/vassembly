# @vassembly/ui-anchor-list

### 1. Package Description
Anchor list UI component for Vassembly design system. Renders a vertical list of navigation links and can highlight an active item.

### 2. Exports & API
## Exports

### `AnchorList(props: AnchorListProps): JSX.Element`
Renders a styled anchor list for in-page navigation. Use it as a controlled component by passing `activeHref` to indicate the currently selected link.

### `AnchorListProps`
Props type for the `AnchorList` component.

### `AnchorListItem`
Item shape for the `items` prop.

### `AnchorListSize`
Visual size variants (`'small' | 'medium' | 'large'`).

## Dependencies
- `@vassembly/ui-utils`: Used for `className` composition (`cn`).
- `@vassembly/theme`: Design-system styling tokens used by the component styles.
- `react`: Component runtime.
- `react-dom`: React DOM runtime.

## Installation
```bash
pnpm add @vassembly/ui-anchor-list
```

## Basic Usage
```tsx
import { AnchorList, type AnchorListItem } from '@vassembly/ui-anchor-list';

const items: AnchorListItem[] = [
  { label: 'Introduction', href: '#introduction' },
  { label: 'Getting Started', href: '#getting-started' },
];

export function Example(): JSX.Element {
  return <AnchorList items={items} activeHref="#introduction" ariaLabel="Page sections" />;
}
```

## Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `AnchorListItem[]` | — | Anchor items to render |
| `activeHref` | `string` | — | Href of the currently active item (adds active styling) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Visual size variant |
| `isDisabled` | `boolean` | `false` | Disables interaction (styling-only; click handler won’t fire) |
| `onItemClick` | `(item: AnchorListItem) => void` | — | Called when an item link is clicked |
| `ariaLabel` | `string` | `'Anchor list'` | Accessible label for the navigation region |

## Examples
### Default
```tsx
import { AnchorList } from '@vassembly/ui-anchor-list';

export function DefaultExample(): JSX.Element {
  return (
    <AnchorList
      items={[
        { label: 'Introduction', href: '#introduction' },
        { label: 'Getting Started', href: '#getting-started' },
      ]}
    />
  );
}
```

### With Active Item
```tsx
import { AnchorList } from '@vassembly/ui-anchor-list';

export function ActiveExample(): JSX.Element {
  return (
    <AnchorList
      items={[
        { label: 'Introduction', href: '#introduction' },
        { label: 'Getting Started', href: '#getting-started' },
      ]}
      activeHref="#getting-started"
    />
  );
}
```

### Disabled
```tsx
import { AnchorList } from '@vassembly/ui-anchor-list';

export function DisabledExample(): JSX.Element {
  return (
    <AnchorList
      items={[
        { label: 'Introduction', href: '#introduction' },
        { label: 'Getting Started', href: '#getting-started' },
      ]}
      isDisabled
      onItemClick={() => {}}
    />
  );
}
```

### Sizes
```tsx
import { AnchorList } from '@vassembly/ui-anchor-list';

const items = [
  { label: 'Section 1', href: '#section-1' },
  { label: 'Section 2', href: '#section-2' },
];

export function SizesExample(): JSX.Element {
  return (
    <>
      <AnchorList items={items} size="small" />
      <AnchorList items={items} size="medium" activeHref="#section-2" />
      <AnchorList items={items} size="large" />
    </>
  );
}
```

