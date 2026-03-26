import { forwardRef, useId, useState } from 'react';
import { ArrowDownIcon, feedbackVariantIconByVariant } from '@vassembly/ui-icons';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Alert.module.scss';
import { AlertCollapsibleDetails, AlertDetailsBody } from './AlertCollapsibleDetails';
import type { AlertProps, AlertVariant } from './types';

const VARIANT_CLASS_MAP: Record<AlertVariant, string> = {
  info: styles.variantInfo,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  error: styles.variantError,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      message,
      variant = 'info',
      showIcon = false,
      icon,
      details,
      isCollapsible = false,
      defaultIsExpanded = true,
      isExpanded: isExpandedControlled,
      onExpandedChange,
      className,
      ...rest
    },
    ref,
  ) => {
    const detailsPanelId = useId();
    const isCollapsibleActive = Boolean(isCollapsible && details);
    const isControlled = isExpandedControlled !== undefined;
    const [internalExpanded, setInternalExpanded] = useState(defaultIsExpanded);
    const isExpanded = isCollapsibleActive
      ? isControlled
        ? isExpandedControlled
        : internalExpanded
      : true;

    const setExpanded = (next: boolean): void => {
      if (!isCollapsibleActive) {
        return;
      }
      if (!isControlled) {
        setInternalExpanded(next);
      }
      onExpandedChange?.(next);
    };

    const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
    const variantClass = VARIANT_CLASS_MAP[variant] ?? styles.variantInfo;
    const DefaultVariantIcon = feedbackVariantIconByVariant[variant];
    const resolvedIcon = icon ?? <DefaultVariantIcon />;
    const messageNode =
      typeof message === 'string' ? (
        <Text variant="body1" as="span">
          {message}
        </Text>
      ) : (
        message
      );

    return (
      <div ref={ref} role={role} className={resolveClassName(styles.alert, variantClass, className)} {...rest}>
        <div className={styles.row}>
          {showIcon ? <span className={styles.icon}>{resolvedIcon}</span> : null}
          <div className={styles.content}>
            {isCollapsibleActive ? (
              <div className={styles.messageRow}>
                <div className={styles.message}>{messageNode}</div>
                <button
                  type="button"
                  className={styles.toggle}
                  aria-expanded={isExpanded}
                  aria-controls={detailsPanelId}
                  onClick={() => {
                    setExpanded(!isExpanded);
                  }}
                >
                  <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                  <span aria-hidden="true">
                    <ArrowDownIcon
                      className={resolveClassName(styles.chevron, isExpanded && styles.chevronOpen)}
                    />
                  </span>
                </button>
              </div>
            ) : (
              <div className={styles.message}>{messageNode}</div>
            )}
            {isCollapsibleActive ? (
              <AlertCollapsibleDetails
                detailsPanelId={detailsPanelId}
                isExpanded={isExpanded}
                details={details}
              />
            ) : details ? (
              <div className={styles.detailsStatic}>
                <AlertDetailsBody details={details} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

Alert.displayName = 'Alert';
