import type { LottieColor } from './types';

const toLottieColor = ({ hex }: { hex: string }): LottieColor => {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;

  return { r, g, b, a: 1 };
};

export const THINKING_ANIMATION_LAYER_COLORS: LottieColor[] = [
  toLottieColor({ hex: '#6b7a9f' }),
  toLottieColor({ hex: '#7a9a8f' }),
  toLottieColor({ hex: '#a1bfd3' }),
];
