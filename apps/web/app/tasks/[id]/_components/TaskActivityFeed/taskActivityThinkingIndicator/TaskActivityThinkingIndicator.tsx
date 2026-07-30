'use client';

import { useMemo } from 'react';
import Lottie from 'lottie-react';

import { applyThemeColorsToThinkingAnimation } from './applyThemeColorsToThinkingAnimation';
import loadingAnimation from './loading-animation.json';
import styles from './TaskActivityThinkingIndicator.module.scss';
import { THINKING_ANIMATION_LAYER_COLORS } from './themeColors';

const THINKING_LABEL = 'Agent is working';

export const TaskActivityThinkingIndicator = (): JSX.Element => {
  const themedAnimation = useMemo(
    () =>
      applyThemeColorsToThinkingAnimation({
        animationData: loadingAnimation,
        layerColors: THINKING_ANIMATION_LAYER_COLORS,
      }),
    [],
  );

  return (
    <div
      className={styles.indicator}
      role="status"
      aria-live="polite"
      aria-label={THINKING_LABEL}
      data-testid="task-activity-thinking-indicator"
    >
      <Lottie
        animationData={themedAnimation}
        loop
        autoplay
        className={styles.animation}
        aria-hidden
      />
    </div>
  );
};
