import type { ComponentType } from 'react';
import { AlertCircleIcon } from './alertCircleIcon';
import { AlertTriangleIcon } from './alertTriangleIcon';
import { CheckCircleIcon } from './checkCircleIcon';
import type { IconProps } from './types';
import { RemoveCircleIcon } from './removeCircleIcon';

export type FeedbackVariant = 'info' | 'success' | 'warning' | 'error';

export const feedbackVariantIconByVariant: Record<
  FeedbackVariant,
  ComponentType<IconProps>
> = {
  info: AlertCircleIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: RemoveCircleIcon,
};
