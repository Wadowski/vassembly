import type { ColorValue } from './types';
import styles from './taskStatusStyles.module.scss';

export const STATUS_COLOR_CLASS_MAP: Record<ColorValue, string> = {
  secondary: styles.statusSecondary ?? '',
  info: styles.statusInfo ?? '',
  success: styles.statusSuccess ?? '',
  error: styles.statusError ?? '',
};
