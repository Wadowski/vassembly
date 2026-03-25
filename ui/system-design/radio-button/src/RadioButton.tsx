import { forwardRef, useId } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as cn } from '@vassembly/ui-utils';
import styles from './RadioButton.module.scss';
import type { RadioButtonProps } from './types';

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const RadioButton = forwardRef<HTMLDivElement, RadioButtonProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      description,
      errorMessage,
      labelPosition = 'right',
      size = 'medium',
      variant = 'default',
      isDisabled = false,
      isReadOnly = false,
      isRequired = false,
    },
    ref,
  ) => {
    const id = useId();
    const labelId = `${id}-label`;
    const supportingTextId = `${id}-supporting`;

    const hasError = variant === 'error' || Boolean(errorMessage);
    const hasSuccess = variant === 'success' && !hasError;
    const displayedSupportingText = errorMessage ?? description;
    const hasSupportingText = Boolean(displayedSupportingText);

    const sizeClass = SIZE_MAP[size];

    const handleToggle = (): void => {
      if (isDisabled || isReadOnly || !onCheckedChange) return;
      onCheckedChange(!checked);
    };

    const labelEl = label ? (
      <Text variant="label" as="span" id={labelId} className={styles.label} onClick={handleToggle}>
        {label}
        {isRequired && (
          <Text variant="caption" as="span" aria-hidden="true">
            {' *'}
          </Text>
        )}
      </Text>
    ) : null;

    return (
      <div
        ref={ref}
        className={cn(styles.wrapper, isDisabled && styles.isDisabled, isReadOnly && styles.isReadOnly)}
      >
        <div className={styles.radioRow}>
          {labelPosition === 'left' && labelEl}
          <button
            type="button"
            role="radio"
            aria-checked={checked ? 'true' : 'false'}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasSupportingText ? supportingTextId : undefined}
            aria-required={isRequired ? true : undefined}
            disabled={isDisabled}
            onClick={handleToggle}
            className={cn(
              styles.circle,
              sizeClass,
              checked && styles.isChecked,
              hasError && styles.stateError,
              hasSuccess && styles.stateSuccess,
            )}
          >
            <span className={styles.dot} aria-hidden="true" />
          </button>
          {labelPosition === 'right' && labelEl}
        </div>
        {hasSupportingText && (
          <Text
            variant="caption"
            as="span"
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

RadioButton.displayName = 'RadioButton';

