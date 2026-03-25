# @vassembly/ui-switch

Switch toggle input component for the Vassembly design system.

## Installation

```bash
pnpm add @vassembly/ui-switch
```

## Usage

```tsx
import { Switch } from '@vassembly/ui-switch';
import { useState } from 'react';

export function Example(): JSX.Element {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  return <Switch label="Email notifications" isChecked={isChecked} onChange={setIsChecked} />;
}
```

```tsx
import { Switch } from '@vassembly/ui-switch';
import { useState } from 'react';

export function ExampleError(): JSX.Element {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  return (
    <Switch
      label="Agree to terms"
      isChecked={isChecked}
      onChange={setIsChecked}
      errorMessage="You must agree before continuing"
    />
  );
}
```

```tsx
import { Switch } from '@vassembly/ui-switch';
import { useState } from 'react';

export function ExampleDisabled(): JSX.Element {
  const [isChecked, setIsChecked] = useState<boolean>(true);

  return <Switch label="Auto updates" isChecked={isChecked} onChange={setIsChecked} isDisabled />;
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `isChecked` | `boolean` | `false` | Controlled checked state |
| `onChange` | `(isChecked: boolean) => void` | — | Called when the switch is toggled |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Visual size variant |
| `label` | `string` | — | Inline label rendered next to the toggle |
| `helperText` | `string` | — | Hint text shown below the switch |
| `errorMessage` | `string` | — | Error text; activates error state automatically |
| `isError` | `boolean` | `false` | Forces error state styling without a message |
| `isDisabled` | `boolean` | `false` | Disables interaction |
| `isReadOnly` | `boolean` | `false` | Prevents toggling; element remains focusable |
| `isLoading` | `boolean` | `false` | Shows pulsing animation; blocks interaction |
| `id` | `string` | auto (`useId`) | HTML id for the toggle button element |
| `className` | `string` | — | Extra CSS class on the outer wrapper |

## Accessibility

- Renders as a `<button role="switch" aria-checked={isChecked}>`.
- When `label` is provided, it’s associated via `aria-labelledby`.
- Supporting text (helper or error) is linked via `aria-describedby`.
