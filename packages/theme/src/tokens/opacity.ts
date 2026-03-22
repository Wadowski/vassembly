export type OpacityTokens = typeof opacity;

export const opacity = {
  0: '0',
  25: '0.25',
  50: '0.5',
  75: '0.75',
  100: '1',
} as const;

export const cssVariables = {
  '--opacity-0': opacity[0],
  '--opacity-25': opacity[25],
  '--opacity-50': opacity[50],
  '--opacity-75': opacity[75],
  '--opacity-100': opacity[100],
} as const;
