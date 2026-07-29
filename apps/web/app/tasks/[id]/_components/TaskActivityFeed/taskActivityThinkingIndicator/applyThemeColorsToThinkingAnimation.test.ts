import { describe, expect, it } from 'vitest';

import { applyThemeColorsToThinkingAnimation } from './applyThemeColorsToThinkingAnimation';
import type { LottieColor } from './types';

const buildAnimationData = (): Record<string, unknown> => ({
  layers: [
    {
      shapes: [
        {
          it: [
            { ty: 'sh' },
            { ty: 'st', c: { k: [0.1, 0.2, 0.3, 1] } },
          ],
        },
      ],
    },
    {
      shapes: [
        {
          it: [
            { ty: 'sh' },
            { ty: 'st', c: { k: [0.4, 0.5, 0.6, 1] } },
          ],
        },
      ],
    },
  ],
});

const layerColors: LottieColor[] = [
  { r: 0.42, g: 0.48, b: 0.62, a: 1 },
  { r: 0.48, g: 0.6, b: 0.56, a: 1 },
];

describe('applyThemeColorsToThinkingAnimation', () => {
  it('should apply theme colors to stroke elements per layer', () => {
    const animationData = buildAnimationData();

    const themedAnimation = applyThemeColorsToThinkingAnimation({
      animationData,
      layerColors,
    });

    const layers = themedAnimation.layers as Array<{
      shapes: Array<{ it: Array<{ c?: { k: number[] } }> }>;
    }>;

    expect(layers[0]?.shapes[0]?.it[1]?.c?.k).toEqual([0.42, 0.48, 0.62, 1]);
    expect(layers[1]?.shapes[0]?.it[1]?.c?.k).toEqual([0.48, 0.6, 0.56, 1]);
  });

  it('should not mutate the original animation data', () => {
    const animationData = buildAnimationData();

    applyThemeColorsToThinkingAnimation({
      animationData,
      layerColors,
    });

    const layers = animationData.layers as Array<{
      shapes: Array<{ it: Array<{ c?: { k: number[] } }> }>;
    }>;

    expect(layers[0]?.shapes[0]?.it[1]?.c?.k).toEqual([0.1, 0.2, 0.3, 1]);
  });
});
