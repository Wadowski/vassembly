# @vassembly/ui-text-field

TextField UI component for the Vassembly design system.

## Installation

```bash
pnpm add @vassembly/ui-text-field
```

## Usage

```tsx
import { TextField } from '@vassembly/ui-text-field';

<TextField
  label="Email"
  helperText="We'll never share your email"
  placeholder="you@example.com"
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'outlined' \| 'filled'` | `'outlined'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the field |
| `label` | `string` | — | Static label above the input |
| `helperText` | `string` | — | Hint text shown below the input |
| `errorMessage` | `string` | — | Error text; activates error state automatically |
| `isError` | `boolean` | `false` | Forces error state styling |
| `isSuccess` | `boolean` | `false` | Forces success state styling |
| `isDisabled` | `boolean` | `false` | Disables the field |
| `isReadOnly` | `boolean` | `false` | Makes the field read-only |
| `isMultiline` | `boolean` | `false` | Renders a `<textarea>` instead of `<input>` |
| `minRows` | `number` | `3` | Minimum visible rows (multiline only) |
| `isFullWidth` | `boolean` | `false` | Stretches the field to fill its container |
| `leadingIcon` | `ComponentType \| ReactNode` | — | Icon rendered before the input |
| `trailingIcon` | `ComponentType \| ReactNode` | — | Icon rendered after the input |
| `prefixText` | `string` | — | Inline text before the input (e.g. `$`) |
| `suffixText` | `string` | — | Inline text after the input (e.g. `.com`) |
