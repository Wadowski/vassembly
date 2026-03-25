# @vassembly/ui-checkbox

### 1. Package Description
Checkbox UI component for Vassembly design system.

### 2. Exports & API
## Exports

### `Checkbox(props: CheckboxProps): JSX.Element`
Renders an accessible, styled checkbox (supports `boolean` and `'indeterminate'`). Use it as a controlled component by passing `checked` and `onCheckedChange`.

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function Example(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return <Checkbox checked={checked} onCheckedChange={setChecked} label="Email notifications" />;
}
```

### `CheckboxProps`
Props type for the `Checkbox` component.

### `CheckboxChecked`
Controlled checked state type (`boolean` or `'indeterminate'`).

### `CheckboxSize`
Visual size variants (`'small' | 'medium' | 'large'`).

### `CheckboxVariant`
Styling variants (`'default' | 'error' | 'success'`).

### `CheckboxLabelPosition`
Label alignment (`'left' | 'right'`).

## Dependencies

- `@vassembly/ui-utils`: Used for `className` composition (`cn`).
- `@vassembly/theme`: Design-system styling tokens used by the component styles.
- `react`: Component runtime.
- `react-dom`: React DOM runtime.

## Installation

```bash
pnpm add @vassembly/ui-checkbox
```

## Usage

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ControlledCheckbox(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      label="Email notifications"
      description="Send me product updates"
    />
  );
}
```

## Examples

### With label, description, errorMessage

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleWithError(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      label="Agree to terms"
      description="You must accept before continuing"
      errorMessage="You must agree before continuing"
    />
  );
}
```

### Indeterminate state

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleIndeterminate(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>('indeterminate');

  return <Checkbox checked={checked} onCheckedChange={setChecked} label="Partially selected" />;
}
```

### Disabled / ReadOnly

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleDisabledAndReadOnly(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(true);

  return (
    <>
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Disabled" isDisabled />
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Read only" isReadOnly />
    </>
  );
}
```

### Size variants (small/medium/large)

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleSizes(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return (
    <>
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Small" size="small" />
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Medium" size="medium" />
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Large" size="large" />
    </>
  );
}
```

### Variant (error/success)

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleVariants(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return (
    <>
      <Checkbox
        checked={checked}
        onCheckedChange={setChecked}
        label="Error state"
        variant="error"
      />
      <Checkbox
        checked={true}
        onCheckedChange={setChecked}
        label="Success state"
        variant="success"
      />
    </>
  );
}
```

### Label position (left/right)

```tsx
import { Checkbox, type CheckboxChecked } from '@vassembly/ui-checkbox';
import { useState } from 'react';

export function ExampleLabelPosition(): JSX.Element {
  const [checked, setChecked] = useState<CheckboxChecked>(false);

  return (
    <>
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Left label" labelPosition="left" />
      <Checkbox checked={checked} onCheckedChange={setChecked} label="Right label" labelPosition="right" />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean \| 'indeterminate'` | — (required) | Controlled checkbox state |
| `onCheckedChange` | `(next: boolean \| 'indeterminate') => void` | — | Called with the next checked state when toggled |
| `label` | `string` | — | Inline label rendered next to the checkbox |
| `description` | `string` | — | Supporting text shown below the checkbox (when `errorMessage` is not provided) |
| `errorMessage` | `string` | — | Supporting error text; also activates error styling |
| `labelPosition` | `'left' \| 'right'` | `'right'` | Where to position the label relative to the checkbox |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Visual size variant |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Controls styling (error/success); `error` or `errorMessage` takes precedence |
| `isDisabled` | `boolean` | `false` | Disables interaction |
| `isReadOnly` | `boolean` | `false` | Prevents toggling while keeping the component focusable |
| `isRequired` | `boolean` | `false` | Marks the checkbox as required via `aria-required` |

## Accessibility

- Uses `role="checkbox"` and `aria-checked` (`'mixed'` when `checked` is `'indeterminate'`, otherwise `'true'`/`'false'`).
- When `label` is provided, it is associated via `aria-labelledby`.
- Supporting text (`description` or `errorMessage`) is associated via `aria-describedby`.
- Keyboard interaction: the checkbox is a `<button>`; use `Tab` to focus and `Space`/`Enter` to toggle. When `isDisabled` is `true`, toggling is blocked; when `isReadOnly` is `true`, toggling is also blocked.

