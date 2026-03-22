export type BreakpointTokens = typeof breakpoints;

export const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
} as const;

export const breakpointPixels = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

export const mediaQueries = {
  mobile: `(min-width: ${breakpoints.mobile})`,
  tablet: `(min-width: ${breakpoints.tablet})`,
  desktop: `(min-width: ${breakpoints.desktop})`,
  wide: `(min-width: ${breakpoints.wide})`,
  ultrawide: `(min-width: ${breakpoints.ultrawide})`,
  mobileOnly: `(max-width: 767px)`,
  tabletAndDown: `(max-width: 1023px)`,
  desktopAndUp: `(min-width: ${breakpoints.desktop})`,
} as const;

export const cssVariables = {
  '--breakpoint-mobile': breakpoints.mobile,
  '--breakpoint-tablet': breakpoints.tablet,
  '--breakpoint-desktop': breakpoints.desktop,
  '--breakpoint-wide': breakpoints.wide,
  '--breakpoint-ultrawide': breakpoints.ultrawide,
} as const;
