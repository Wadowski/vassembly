import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { RadioButton } from './RadioButton';
import styles from './RadioButtonGroup.module.scss';
import type { RadioButtonGroupProps, RadioButtonVariant } from './types';

export const RadioButtonGroup = ({
  value,
  onChange,
  options,
  label,
  description,
  errorMessage,
  size = 'medium',
  variant = 'default',
  isDisabled = false,
  isReadOnly = false,
  isRequired = false,
  labelPosition = 'right',
  direction = 'vertical',
}: RadioButtonGroupProps): ReactElement => {
  const groupId = useId();
  const labelId = `${groupId}-label`;
  const supportingTextId = `${groupId}-supporting`;

  const hasError = variant === 'error' || Boolean(errorMessage);
  const hasSuccess = variant === 'success' && !hasError;
  const activeVariant: RadioButtonVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;
  const displayedSupportingText = errorMessage ?? description;
  const hasSupportingText = Boolean(displayedSupportingText);

  const groupRef = useRef<HTMLDivElement>(null);

  const handleOptionsKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const isVertical = direction === 'vertical';
    const isForward = isVertical ? e.key === 'ArrowDown' : e.key === 'ArrowRight';
    const isBackward = isVertical ? e.key === 'ArrowUp' : e.key === 'ArrowLeft';
    if (!isForward && !isBackward) {
      return;
    }

    const root = groupRef.current;
    if (root === null) {
      return;
    }

    const radios = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'),
    );
    if (radios.length === 0) {
      return;
    }

    const active = document.activeElement;
    if (active === null || !(active instanceof HTMLButtonElement)) {
      return;
    }

    const currentIndex = radios.indexOf(active);
    if (currentIndex === -1) {
      return;
    }

    e.preventDefault();

    const nextIndex = isForward
      ? (currentIndex + 1) % radios.length
      : (currentIndex - 1 + radios.length) % radios.length;
    const nextRadio = radios[nextIndex];
    nextRadio?.focus();

    if (isReadOnly) {
      return;
    }

    const wrapper = nextRadio?.closest('[data-radio-value]');
    if (!(wrapper instanceof HTMLElement)) {
      return;
    }

    const nextValue = wrapper.getAttribute('data-radio-value');
    if (nextValue === null || nextValue === '') {
      return;
    }

    onChange(nextValue);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={hasSupportingText ? supportingTextId : undefined}
      aria-required={isRequired ? true : undefined}
      className={resolveClassName(styles.group, isDisabled && styles.isDisabled, isReadOnly && styles.isReadOnly)}
    >
      {label ? (
        <Text variant="label" as="span" id={labelId} className={styles.groupLabel}>
          {label}
          {isRequired ? (
            <Text variant="caption" as="span" aria-hidden="true">
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}
      <div
        ref={groupRef}
        className={resolveClassName(
          styles.optionsList,
          direction === 'horizontal' ? styles.horizontal : styles.vertical,
        )}
        onKeyDown={handleOptionsKeyDown}
      >
        {options.map((option, index) => (
          <div key={option.value} data-radio-value={option.value}>
            <RadioButton
              checked={value === option.value}
              onCheckedChange={(nextChecked) => {
                if (nextChecked && !isReadOnly) {
                  onChange(option.value);
                }
              }}
              label={option.label}
              size={size}
              variant={activeVariant}
              isDisabled={isDisabled || Boolean(option.isDisabled)}
              isReadOnly={isReadOnly}
              isRequired={isRequired && index === 0}
              labelPosition={labelPosition}
            />
          </div>
        ))}
      </div>
      {hasSupportingText ? (
        <Text
          variant="caption"
          as="span"
          id={supportingTextId}
          className={hasError ? styles.errorText : styles.helperText}
        >
          {displayedSupportingText}
        </Text>
      ) : null}
    </div>
  );
};

RadioButtonGroup.displayName = 'RadioButtonGroup';
