export interface LottieColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ApplyThemeColorsToThinkingAnimationParams {
  animationData: Record<string, unknown>;
  layerColors: LottieColor[];
}
