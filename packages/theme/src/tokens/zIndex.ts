export type ZIndexTokens = typeof zIndex;

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  popover: 1040,
  tooltip: 1050,
  modal: 1060,
  offcanvas: 1070,
} as const;

export const cssVariables = {
  '--z-hide': String(zIndex.hide),
  '--z-base': String(zIndex.base),
  '--z-dropdown': String(zIndex.dropdown),
  '--z-sticky': String(zIndex.sticky),
  '--z-fixed': String(zIndex.fixed),
  '--z-popover': String(zIndex.popover),
  '--z-tooltip': String(zIndex.tooltip),
  '--z-modal': String(zIndex.modal),
  '--z-offcanvas': String(zIndex.offcanvas),
} as const;
