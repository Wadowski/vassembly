import { forwardRef, useId } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as cn } from '@vassembly/ui-utils';
import styles from './Checkbox.module.scss';
import type { CheckboxProps, CheckboxChecked } from './types';

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(
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

    const ariaChecked = checked === 'indeterminate' ? 'mixed' : checked ? 'true' : 'false';

    const sizeClass = SIZE_MAP[size];

    const handleToggle = (): void => {
      if (isDisabled || isReadOnly || !onCheckedChange) return;
      const next: CheckboxChecked = checked === 'indeterminate' ? true : !checked;
      onCheckedChange(next);
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
        <div className={styles.checkboxRow}>
          {labelPosition === 'left' && labelEl}
          <button
            type="button"
            role="checkbox"
            aria-checked={ariaChecked}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasSupportingText ? supportingTextId : undefined}
            aria-required={isRequired ? true : undefined}
            disabled={isDisabled}
            onClick={handleToggle}
            className={cn(
              styles.box,
              sizeClass,
              checked === true && styles.isChecked,
              checked === 'indeterminate' && styles.isIndeterminate,
              hasError && styles.stateError,
              hasSuccess && styles.stateSuccess,
            )}
          >
            <span className={styles.icon} aria-hidden="true" />
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

Checkbox.displayName = 'Checkbox';

