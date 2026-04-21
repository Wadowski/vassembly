import type { LayoutPreset, LayoutVariant } from './types';
import { MAIN_LAYOUT_PRESET } from './presets/main';

export const LAYOUT_VARIANT_PRESETS: Record<LayoutVariant, LayoutPreset> = {
  main: MAIN_LAYOUT_PRESET,
};
