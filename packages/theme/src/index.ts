export { colors, type ColorTokens } from './tokens/colors';
export { spacing, type SpacingTokens } from './tokens/spacing';
export { borderRadius, type BorderRadiusTokens } from './tokens/borderRadius';
export { shadows, type ShadowTokens } from './tokens/shadows';
export {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  type TypographyTokens,
} from './tokens/typography';
export { opacity, type OpacityTokens } from './tokens/opacity';
export {
  breakpoints,
  breakpointPixels,
  mediaQueries,
  type BreakpointTokens,
} from './tokens/breakpoints';
export { zIndex, type ZIndexTokens } from './tokens/zIndex';

import * as colorTokens from './tokens/colors';
import * as spacingTokens from './tokens/spacing';
import * as borderRadiusTokens from './tokens/borderRadius';
import * as shadowTokens from './tokens/shadows';
import * as typographyTokens from './tokens/typography';
import * as opacityTokens from './tokens/opacity';
import * as breakpointTokens from './tokens/breakpoints';
import * as zIndexTokens from './tokens/zIndex';

export type AllCSSVariables = Record<string, string | number>;

export function getAllCSSVariables(): AllCSSVariables {
  return {
    ...colorTokens.cssVariables,
    ...spacingTokens.cssVariables,
    ...borderRadiusTokens.cssVariables,
    ...shadowTokens.cssVariables,
    ...typographyTokens.cssVariables,
    ...opacityTokens.cssVariables,
    ...breakpointTokens.cssVariables,
    ...zIndexTokens.cssVariables,
  };
}

export function injectThemeCSSVariables(): void {
  const root = document.documentElement;
  const variables = getAllCSSVariables();

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, String(value));
  });
}
