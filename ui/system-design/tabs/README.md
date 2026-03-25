# @vassembly/ui-tabs

### 1. Package Description
Tabs UI component for Vassembly design system.

### 2. Exports & API
## Exports

### `Tabs(props: TabsProps): JSX.Element`
Renders an accessible, controlled tablist. Use it as a controlled component by passing `activeTab` and `onChange`.

```tsx
import { Tabs } from '@vassembly/ui-tabs';
import { useState } from 'react';

export function Example(): JSX.Element {
  const [activeTab, setActiveTab] = useState('a');

  return (
    <Tabs
      items={[
        { label: 'Tab A', value: 'a' },
        { label: 'Tab B', value: 'b' },
      ]}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  );
}
```

### `TabsProps`
Props type for the `Tabs` component.

### `TabsItem`
Tab item type.

## Installation

```bash
pnpm add @vassembly/ui-tabs
```

## Usage

```tsx
import { Tabs } from '@vassembly/ui-tabs';
import { useState } from 'react';

export function ControlledTabs(): JSX.Element {
  const [activeTab, setActiveTab] = useState('a');

  return (
    <Tabs
      items={[
        { label: 'Tab A', value: 'a' },
        { label: 'Tab B', value: 'b', isDisabled: true },
      ]}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `TabsItem[]` | — | List of tabs |
| `activeTab` | `string` | — | Currently selected tab value |
| `onChange` | `(nextValue: string) => void` | — | Called when a user selects a different tab |

## Accessibility

- Uses `role="tablist"` on the container.
- Each tab button uses `role="tab"`.
- The selected tab sets `aria-selected="true"`.
- Disabled tabs use `aria-disabled="true"` and `disabled` to prevent interaction.

