export type SpacingTokens = typeof spacing;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
  '4xl': '4rem',
  '5xl': '5rem',
  '6xl': '6rem',
  '7xl': '7rem',
  '8xl': '8rem',
} as const;

export const cssVariables = {
  '--spacing-xs': spacing.xs,
  '--spacing-sm': spacing.sm,
  '--spacing-md': spacing.md,
  '--spacing-lg': spacing.lg,
  '--spacing-xl': spacing.xl,
  '--spacing-2xl': spacing['2xl'],
  '--spacing-3xl': spacing['3xl'],
  '--spacing-4xl': spacing['4xl'],
  '--spacing-5xl': spacing['5xl'],
  '--spacing-6xl': spacing['6xl'],
  '--spacing-7xl': spacing['7xl'],
  '--spacing-8xl': spacing['8xl'],
} as const;
