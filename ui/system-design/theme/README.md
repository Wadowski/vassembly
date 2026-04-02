# @vassembly/theme

Design tokens and theme utilities for the Vassembly design system.

## Overview

This package provides a comprehensive set of design tokens that define the visual language and styling constants used across all Vassembly components and applications. All tokens are available as both JavaScript objects and CSS variables.

## Features

- **Comprehensive Design Tokens**: Colors, spacing, typography, shadows, border radius, breakpoints, and z-index scales
- **Multiple Export Formats**: TypeScript/JavaScript objects and CSS variables
- **Type-Safe**: Full TypeScript support with proper typing
- **Easy Integration**: Single function to inject all tokens as CSS variables
- **Storybook Stories**: Visual showcase of all design tokens

## Installation

```bash
pnpm add @vassembly/theme
```

## Usage

### Import Tokens in TypeScript/JavaScript

```typescript
import {
  colors,
  spacing,
  fontSizes,
  shadows,
  breakpoints,
  zIndex,
} from '@vassembly/theme';

const buttonStyle = {
  backgroundColor: colors.primary[500],
  padding: spacing.md,
  fontSize: fontSizes.lg,
  boxShadow: shadows.md,
};
```

### Use CSS Variables

First, inject the theme CSS variables into your application:

```typescript
import { injectThemeCSSVariables } from '@vassembly/theme';

// In your app initialization
injectThemeCSSVariables();
```

Then use the variables in your CSS:

```css
.button {
  background-color: var(--color-primary-500);
  padding: var(--spacing-md);
  font-size: var(--font-size-lg);
  box-shadow: var(--shadow-md);
}
```

### Get All CSS Variables

```typescript
import { getAllCSSVariables } from '@vassembly/theme';

const allVariables = getAllCSSVariables();
// Returns object with all CSS variable names and values
```

## Design Tokens

### Colors

Organized color palette with primary, secondary, success, warning, error, and neutral colors, each with multiple shades (50-900).

```typescript
import { colors } from '@vassembly/theme';

colors.primary[500]; // #0ea5e9
colors.success[600]; // #16a34a
colors.error[500]; // #ef4444
```

**CSS Variables**: `--color-primary-50`, `--color-primary-100`, ..., `--color-error-900`, etc.

### Spacing

Consistent spacing scale from `xs` (0.25rem) to `8xl` (8rem).

```typescript
import { spacing } from '@vassembly/theme';

spacing.sm; // 0.5rem
spacing.md; // 1rem
spacing.xl; // 2rem
```

**CSS Variables**: `--spacing-xs`, `--spacing-sm`, ..., `--spacing-8xl`

### Typography

Font families, sizes, weights, and line heights.

```typescript
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '@vassembly/theme';

fontFamilies.primary; // System font stack
fontSizes.xl; // 1.25rem
fontWeights.semibold; // 600
lineHeights.normal; // 1.5
```

**CSS Variables**: `--font-primary`, `--font-size-xl`, `--font-weight-semibold`, `--line-height-normal`, etc.

### Border Radius

Rounded corner sizes from `none` to `full`.

```typescript
import { borderRadius } from '@vassembly/theme';

borderRadius.md; // 0.375rem
borderRadius.full; // 9999px
```

**CSS Variables**: `--radius-none`, `--radius-sm`, ..., `--radius-full`

### Shadows

Elevation and shadow effects for different contexts.

```typescript
import { shadows } from '@vassembly/theme';

shadows.md; // Standard medium shadow
shadows.modal; // Shadow for modals
shadows.tooltip; // Shadow for tooltips
```

**CSS Variables**: `--shadow-sm`, `--shadow-md`, `--shadow-elevated`, `--shadow-modal`, etc.

### Opacity

Opacity scale from 0 to 100%.

```typescript
import { opacity } from '@vassembly/theme';

opacity[50]; // 0.5
opacity[75]; // 0.75
```

**CSS Variables**: `--opacity-0`, `--opacity-25`, `--opacity-50`, `--opacity-75`, `--opacity-100`

### Breakpoints

Responsive design breakpoints.

```typescript
import {
  breakpoints,
  breakpointPixels,
  mediaQueries,
} from '@vassembly/theme';

breakpoints.tablet; // 768px
breakpointPixels.desktop; // 1024
mediaQueries.mobile; // (min-width: 375px)
mediaQueries.mobileOnly; // (max-width: 767px)
```

**CSS Variables**: `--breakpoint-mobile`, `--breakpoint-tablet`, ..., `--breakpoint-ultrawide`

### Z-Index

Z-index scale for layering.

```typescript
import { zIndex } from '@vassembly/theme';

zIndex.modal; // 1060
zIndex.dropdown; // 1000
zIndex.tooltip; // 1050
```

**CSS Variables**: `--z-dropdown`, `--z-sticky`, `--z-fixed`, `--z-modal`, etc.

## Integrating with React Components

### Using with Styled Components or Similar

```typescript
import styled from 'styled-components';
import { colors, spacing, fontSizes } from '@vassembly/theme';

export const StyledButton = styled.button`
  background-color: ${colors.primary[500]};
  color: ${colors.neutral[0]};
  padding: ${spacing.md} ${spacing.lg};
  font-size: ${fontSizes.md};
  border: none;
  border-radius: ${borderRadius.md};
  cursor: pointer;

  &:hover {
    background-color: ${colors.primary[600]};
  }
`;
```

### Using with Inline Styles

```typescript
import { colors, spacing } from '@vassembly/theme';

export function Button() {
  return (
    <button
      style={{
        backgroundColor: colors.primary[500],
        padding: spacing.md,
      }}
    >
      Click me
    </button>
  );
}
```

### Using with Tailwind CSS

Configure Tailwind to use the tokens:

```javascript
// tailwind.config.js
import { colors, spacing, fontSizes } from '@vassembly/theme';

export default {
  theme: {
    extend: {
      colors,
      spacing,
      fontSize: fontSizes,
    },
  },
};
```

## Storybook

View all design tokens visually in Storybook:

```bash
pnpm storybook
```

Navigate to **Theme/Design Tokens** to see:
- All colors with hex values
- Spacing scale visualization
- Typography specimens
- Shadow demonstrations
- Border radius examples
- Breakpoint ranges
- Z-index layers
- Complete reference guide

## API Reference

### Functions

- `getAllCSSVariables(): AllCSSVariables` - Returns all CSS variables as a key-value object
- `injectThemeCSSVariables(): void` - Injects all CSS variables into the document root

### Types

- `ColorTokens` - Type for colors object
- `SpacingTokens` - Type for spacing object
- `BorderRadiusTokens` - Type for border radius object
- `ShadowTokens` - Type for shadows object
- `TypographyTokens` - Type for typography
- `OpacityTokens` - Type for opacity object
- `BreakpointTokens` - Type for breakpoints object
- `ZIndexTokens` - Type for z-index object
- `AllCSSVariables` - Type for all CSS variables

## Best Practices

1. **Use tokens consistently**: Always use tokens instead of hardcoding values
2. **Respect the hierarchy**: Use appropriate shades/levels for different contexts
3. **Type safety**: Import types when creating themed components
4. **Performance**: Cache token imports in component files
5. **Accessibility**: Ensure sufficient color contrast using provided shades
6. **Responsive design**: Use `mediaQueries` for breakpoint-aware styling

## License

Private package for Vassembly
