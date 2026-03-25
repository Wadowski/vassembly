# @vassembly/ui-dropdown

Dropdown (single-select combobox) for the Vassembly design system.

## Installation

```bash
pnpm add @vassembly/ui-dropdown
```

## Usage

```tsx
import { Dropdown } from '@vassembly/ui-dropdown';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

<Dropdown
  label="Choose"
  placeholder="Select an option"
  options={options}
  value={value}
  onValueChange={setValue}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `DropdownOption[]` | — | Choices (`value` + `label`) |
| `value` | `string` | — | Controlled selected value |
| `defaultValue` | `string` | `''` | Initial value when uncontrolled |
| `onValueChange` | `(value: string) => void` | — | Called when selection changes |
| `placeholder` | `string` | — | Shown when nothing is selected |
| `label` | `string` | — | Label above the trigger |
| `isDisabled` | `boolean` | `false` | Disables the control |
| `isFullWidth` | `boolean` | `false` | Full width layout |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Trigger size (matches `Button`) |
| `name` | `string` | — | If set, renders a hidden input for forms |
| `id` | `string` | — | Optional id for the combobox trigger |
