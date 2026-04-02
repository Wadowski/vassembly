import { forwardRef, useId, type ReactElement } from 'react';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Checkbox.module.scss';
import type { CheckboxProps, CheckboxChecked, CheckboxLabelProps } from './types';

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

const CheckboxLabel = ({
  label,
  labelId,
  isRequired,
  onClick,
}: CheckboxLabelProps): ReactElement | null => {
  if (!label) {
    return null;
  }
  return (
    <Text variant="label" as="span" id={labelId} className={styles.label} onClick={onClick}>
      {label}
      {isRequired && (
        <Text variant="caption" as="span" aria-hidden="true">
          {' *'}
        </Text>
      )}
    </Text>
  );
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

    return (
      <div
        ref={ref}
        className={resolveClassName(styles.wrapper, isDisabled && styles.isDisabled, isReadOnly && styles.isReadOnly)}
      >
        <div className={styles.checkboxRow}>
          {labelPosition === 'left' && (
            <CheckboxLabel label={label} labelId={labelId} isRequired={isRequired} onClick={handleToggle} />
          )}
          <button
            type="button"
            role="checkbox"
            aria-checked={ariaChecked}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasSupportingText ? supportingTextId : undefined}
            aria-required={isRequired ? true : undefined}
            disabled={isDisabled}
            onClick={handleToggle}
            className={resolveClassName(
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
          {labelPosition === 'right' && (
            <CheckboxLabel label={label} labelId={labelId} isRequired={isRequired} onClick={handleToggle} />
          )}
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

