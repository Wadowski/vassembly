import { forwardRef } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as cn } from '@vassembly/ui-utils';
import styles from './Snackbar.module.scss';
import type { SnackbarProps, SnackbarVariant } from './types';
import { IconByVariant } from './Icons';

const VARIANT_CLASS_MAP: Record<SnackbarVariant, string> = {
  info: styles.variantInfo,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  error: styles.variantError,
};

export const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(
  ({ message, variant = 'info', isDismissible = false, onDismiss }, ref) => {
    const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
    const variantClass = VARIANT_CLASS_MAP[variant] ?? styles.variantInfo;

    return (
      <div ref={ref} role={role} className={cn(styles.snackbar, variantClass)}>
        <span className={styles.icon}>{IconByVariant[variant]}</span>
        <div className={styles.message}>
          <Text variant="body1" as="span">
            {message}
          </Text>
        </div>
        {isDismissible && (
          <button
            type="button"
            className={styles.dismissButton}
            aria-label="Dismiss notification"
            onClick={onDismiss}
          >
            <span className={styles.dismissIcon} aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  },
);

Snackbar.displayName = 'Snackbar';

