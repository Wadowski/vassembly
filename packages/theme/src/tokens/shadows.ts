export type ShadowTokens = typeof shadows;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  elevated: '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
  tooltip: '0 4px 6px -1px rgba(0, 0, 0, 0.12)',
  inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

export const cssVariables = {
  '--shadow-none': shadows.none,
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  '--shadow-2xl': shadows['2xl'],
  '--shadow-elevated': shadows.elevated,
  '--shadow-modal': shadows.modal,
  '--shadow-dropdown': shadows.dropdown,
  '--shadow-tooltip': shadows.tooltip,
  '--shadow-inset': shadows.inset,
} as const;
