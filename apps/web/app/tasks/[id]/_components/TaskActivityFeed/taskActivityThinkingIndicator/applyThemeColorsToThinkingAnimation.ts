import type { ApplyThemeColorsToThinkingAnimationParams, LottieColor } from './types';

const toColorArray = ({ r, g, b, a }: LottieColor): [number, number, number, number] => [r, g, b, a];

const applyStrokeColorsToLayer = ({
  layer,
  color,
}: {
  layer: Record<string, unknown>;
  color: LottieColor;
}): void => {
  const shapes = layer.shapes;

  if (!Array.isArray(shapes)) {
    return;
  }

  for (const shape of shapes) {
    if (!shape || typeof shape !== 'object') {
      continue;
    }

    const shapeItems = (shape as { it?: unknown }).it;

    if (!Array.isArray(shapeItems)) {
      continue;
    }

    for (const item of shapeItems) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const stroke = item as { ty?: string; c?: { k?: unknown } };

      if (stroke.ty !== 'st' || !stroke.c || !Array.isArray(stroke.c.k)) {
        continue;
      }

      stroke.c.k = toColorArray(color);
    }
  }
};

export const applyThemeColorsToThinkingAnimation = ({
  animationData,
  layerColors,
}: ApplyThemeColorsToThinkingAnimationParams): Record<string, unknown> => {
  const themedAnimation = structuredClone(animationData);
  const layers = themedAnimation.layers;

  if (!Array.isArray(layers)) {
    return themedAnimation;
  }

  layers.forEach((layer, index) => {
    if (!layer || typeof layer !== 'object') {
      return;
    }

    const color = layerColors[index % layerColors.length];

    if (!color) {
      return;
    }

    applyStrokeColorsToLayer({ layer: layer as Record<string, unknown>, color });
  });

  return themedAnimation;
};
