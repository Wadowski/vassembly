export type TypographyTokens = {
  fontFamilies: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  lineHeights: typeof lineHeights;
};

export const fontFamilies = {
  primary: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", Courier, monospace',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export const lineHeights = {
  tight: 1.1,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

export const cssVariables = {
  '--font-primary': fontFamilies.primary,
  '--font-mono': fontFamilies.mono,
  '--font-serif': fontFamilies.serif,
  '--font-size-xs': fontSizes.xs,
  '--font-size-sm': fontSizes.sm,
  '--font-size-md': fontSizes.md,
  '--font-size-lg': fontSizes.lg,
  '--font-size-xl': fontSizes.xl,
  '--font-size-2xl': fontSizes['2xl'],
  '--font-size-3xl': fontSizes['3xl'],
  '--font-size-4xl': fontSizes['4xl'],
  '--font-size-5xl': fontSizes['5xl'],
  '--font-size-6xl': fontSizes['6xl'],
  '--font-size-7xl': fontSizes['7xl'],
  '--font-size-8xl': fontSizes['8xl'],
  '--font-size-9xl': fontSizes['9xl'],
  '--font-weight-light': String(fontWeights.light),
  '--font-weight-regular': String(fontWeights.regular),
  '--font-weight-medium': String(fontWeights.medium),
  '--font-weight-semibold': String(fontWeights.semibold),
  '--font-weight-bold': String(fontWeights.bold),
  '--font-weight-extrabold': String(fontWeights.extrabold),
  '--font-weight-black': String(fontWeights.black),
  '--line-height-tight': String(lineHeights.tight),
  '--line-height-normal': String(lineHeights.normal),
  '--line-height-relaxed': String(lineHeights.relaxed),
  '--line-height-loose': String(lineHeights.loose),
} as const;
