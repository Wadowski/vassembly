import { forwardRef, useId } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './Switch.module.scss';
import type { SwitchProps } from './types';

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  (
    {
      isChecked = false,
      onChange,
      size = 'medium',
      label,
      helperText,
      errorMessage,
      isError = false,
      isDisabled = false,
      isReadOnly = false,
      isLoading = false,
      id,
      className,
    },
    ref,
  ) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const supportingTextId = `${switchId}-supporting`;
    const labelId = `${switchId}-label`;

    const hasError = isError || !!errorMessage;
    const hasSupportingText = !!helperText || !!errorMessage;
    const displayedSupportingText = errorMessage ?? helperText;

    const wrapperClassName = uiClassName(styles.wrapper, isDisabled && styles.isDisabled, isReadOnly && styles.isReadOnly, className);

    const trackClassName = uiClassName(
      styles.track,
      SIZE_MAP[size],
      isChecked && styles.isChecked,
      hasError && styles.stateError,
      isLoading && styles.isLoading,
    );

    const handleClick = (): void => {
      if (isReadOnly) {
        return;
      }
      onChange?.(!isChecked);
    };

    return (
      <div className={wrapperClassName} ref={ref}>
        <div className={styles.switchRow}>
          <button
            type="button"
            id={switchId}
            role="switch"
            aria-checked={isChecked}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasSupportingText ? supportingTextId : undefined}
            disabled={isDisabled || isLoading}
            onClick={handleClick}
            className={trackClassName}
          >
            <span className={styles.thumb} />
          </button>
          {label && (
            <Text variant="label" as="span" id={labelId} className={styles.label}>
              {label}
            </Text>
          )}
        </div>
        {hasSupportingText && (
          <Text
            variant="caption"
            id={supportingTextId}
            className={hasError ? styles.errorText : styles.helperText}
          >
            {displayedSupportingText}
          </Text>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
