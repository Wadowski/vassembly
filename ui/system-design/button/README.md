# @vassembly/ui-button

A flexible, accessible Button component for the Vassembly design system.

## Installation

```bash
npm install @vassembly/ui-button
# or
pnpm add @vassembly/ui-button
```

## Basic Usage

```tsx
import { Button } from '@vassembly/ui-button';

export default function App() {
  return <Button>Click Me</Button>;
}
```

## API Reference

### ButtonProps

The `Button` component accepts all standard HTML button element attributes, plus the following custom props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | `'primary'` | Color of the button |
| `variant` | `'contained' \| 'outlined' \| 'text'` | `'contained'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `isDisabled` | `boolean` | `false` | Disabled state |
| `isLoading` | `boolean` | `false` | Loading state with spinner |
| `isFullWidth` | `boolean` | `false` | Stretch button to full width |
| `icon` | `IconComponent \| React.ReactNode` | `undefined` | Icon component to display (SVG component preferred) |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of icon relative to text |
| `children` | `React.ReactNode` | - | Button text or content |

## Color Options

### Primary

Primary color for main actions.

```tsx
<Button color="primary">Primary</Button>
```

### Secondary

Secondary color for alternative actions.

```tsx
<Button color="secondary">Secondary</Button>
```

### Tertiary

Tertiary color for additional actions.

```tsx
<Button color="tertiary">Tertiary</Button>
```

### Danger

Danger color for destructive actions.

```tsx
<Button color="danger">Delete</Button>
```

## Variants

### Contained

Solid background variant with emphasis.

```tsx
<Button variant="contained">Contained</Button>
```

### Outlined

Border-only variant for secondary actions.

```tsx
<Button variant="outlined">Outlined</Button>
```

### Text

Text-only variant for minimal visual emphasis.

```tsx
<Button variant="text">Text</Button>
```

## Sizes

### Small

For compact layouts and secondary actions.

```tsx
<Button size="small">Small Button</Button>
```

### Medium

Default size for most use cases.

```tsx
<Button size="medium">Medium Button</Button>
```

### Large

For prominent actions and call-to-action buttons.

```tsx
<Button size="large">Large Button</Button>
```

## States

### Disabled

Prevent interactions with the disabled state.

```tsx
<Button isDisabled>Disabled Button</Button>
```

### Loading

Show a spinner during async operations.

```tsx
<Button isLoading>Processing...</Button>
```

### Icon Support

Add SVG icon components before or after the button text.

```tsx
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

<Button icon={SearchIcon} iconPosition="left">
  Search
</Button>

<Button icon={SearchIcon} iconPosition="right">
  Next
</Button>
```

### Full Width

Stretch the button to fill its container.

```tsx
<Button isFullWidth>Full Width Button</Button>
```

## Examples

### Combined Colors and Variants

```tsx
<Button color="primary" variant="contained">Primary Contained</Button>
<Button color="secondary" variant="outlined">Secondary Outlined</Button>
<Button color="tertiary" variant="text">Tertiary Text</Button>
```

### Submit Form

```tsx
<Button color="primary" variant="contained" type="submit">
  Submit
</Button>
```

### Delete Action

```tsx
const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

<Button color="danger" variant="contained" icon={DeleteIcon} iconPosition="left">
  Delete Item
</Button>
```

### Async Action

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
  setIsLoading(true);
  try {
    await someAsyncOperation();
  } finally {
    setIsLoading(false);
  }
};

<Button color="primary" variant="contained" isLoading={isLoading} onClick={handleClick}>
  Save Changes
</Button>
```

### Secondary Action Button

```tsx
<Button color="secondary" variant="outlined">
  Cancel
</Button>
```

### Link-like Button

```tsx
<Button color="primary" variant="text">
  Learn More
</Button>
```

## Accessibility

The Button component is built with accessibility in mind:

- **Keyboard Navigation**: Fully keyboard accessible with proper focus management
- **Semantic HTML**: Uses native `<button>` element for proper semantics
- **ARIA Attributes**: Automatically manages disabled states and aria attributes
- **Focus Indicators**: Clear focus ring for keyboard navigation
- **Loading State**: Spinner is hidden from screen readers
- **Color Contrast**: All color combinations meet WCAG AA standards

### Best Practices

- Use meaningful button text that describes the action
- Prefer labels over icons alone
- Use `color="danger"` with `variant="contained"` for destructive actions
- Show loading state for async operations
- Properly disable buttons during processing

## Styling

The component uses SCSS modules and design tokens from `@vassembly/theme`. It automatically inherits:

- Color schemes
- Typography
- Spacing
- Shadows
- Border radius

No additional CSS imports are required beyond the component itself.

## Component Composition

The Button component is built with:

- React 18+
- TypeScript
- SCSS modules
- Accessibility best practices

## Ref Forwarding

The Button component forwards refs to the underlying `<button>` element:

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

<Button ref={buttonRef}>
  Click Me
</Button>
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import { Button, type ButtonProps, type ButtonSize, type ButtonColor, type ButtonVariant } from '@vassembly/ui-button';

const props: ButtonProps = {
  color: 'primary',
  variant: 'contained',
  size: 'medium',
  children: 'Button',
};
```

## License

MIT
