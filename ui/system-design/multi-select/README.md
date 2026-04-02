# @vassembly/ui-multi-select

Multi-select dropdown (combobox with listbox) for the Vassembly design system.

## Installation

```bash
pnpm add @vassembly/ui-multi-select
```

## Usage

```tsx
import { MultiSelect } from '@vassembly/ui-multi-select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

<MultiSelect
  label="Choose"
  placeholder="Select options"
  options={options}
  values={values}
  onValuesChange={setValues}
  hasSelectAll
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `MultiSelectOption[]` | — | Choices (`value`, `label`, optional `isDisabled`) |
| `values` | `string[]` | — | Controlled selected values |
| `defaultValues` | `string[]` | `[]` | Initial values when uncontrolled |
| `onValuesChange` | `(values: string[]) => void` | — | Called when selection changes |
| `placeholder` | `string` | — | Shown when nothing is selected |
| `label` | `string` | — | Label above the trigger |
| `isDisabled` | `boolean` | `false` | Disables the control |
| `isFullWidth` | `boolean` | `false` | Full width layout |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Trigger size (matches `Button`) |
| `name` | `string` | — | If set, renders hidden inputs for forms |
| `id` | `string` | — | Optional id for the combobox trigger |
| `hasSelectAll` | `boolean` | `false` | Shows a select-all row at the top |
| `maxDisplayLabels` | `number` | `2` | Join labels until count exceeds this, then show `"N selected"` |
