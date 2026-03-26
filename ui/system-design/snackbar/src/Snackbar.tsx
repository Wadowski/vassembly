import { forwardRef } from 'react';
import { CloseIcon, feedbackVariantIconByVariant } from '@vassembly/ui-icons';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Snackbar.module.scss';
import type { SnackbarProps, SnackbarVariant } from './types';

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
    const VariantIcon = feedbackVariantIconByVariant[variant];

    return (
      <div ref={ref} role={role} className={resolveClassName(styles.snackbar, variantClass)}>
        <span className={styles.icon}>
          <VariantIcon />
        </span>
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
            <span className={styles.dismissIcon} aria-hidden="true">
              <CloseIcon />
            </span>
          </button>
        )}
      </div>
    );
  },
);

Snackbar.displayName = 'Snackbar';

