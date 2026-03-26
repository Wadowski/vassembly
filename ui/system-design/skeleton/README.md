# @vassembly/ui-skeleton

A loading placeholder block for the Vassembly design system (The Synthetic Luminal). It renders a neutral `surface-container` base with a shimmer band that moves across using theme mid-tones and `cubic-bezier(0.22, 1, 0.36, 1)` easing.

## Usage

```tsx
import { Skeleton } from '@vassembly/ui-skeleton';

<Skeleton />
<Skeleton width="12rem" height="0.75rem" />
<Skeleton width="3rem" height="3rem" borderRadius="50%" />
```

Optional props `width`, `height`, and `borderRadius` map to inline styles. Defaults: `width` `100%`, `height` `1rem`, `borderRadius` from the stylesheet (`$border-radius-sm`) unless you override it. Pass `className` for layout or token-based tweaks.

## Dependencies

- `@vassembly/theme`, `react`, `react-dom`
