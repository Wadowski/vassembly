import { forwardRef, useId } from 'react';
import type React from 'react';
import { Text } from '@vassembly/ui-text';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './TextField.module.scss';
import type { TextFieldProps } from './types';

const VARIANT_MAP = {
  outlined: styles.variantOutlined,
  filled: styles.variantFilled,
};

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

const renderIcon = (
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ReactNode,
): React.ReactNode => {
  if (typeof icon === 'function') {
    const IconComponent = icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    return <IconComponent />;
  }
  return icon as React.ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      variant = 'outlined',
      size = 'medium',
      isFullWidth = false,
      label,
      helperText,
      errorMessage,
      isError = false,
      isSuccess = false,
      isDisabled = false,
      isReadOnly = false,
      isMultiline = false,
      minRows = 3,
      leadingIcon,
      trailingIcon,
      prefixText,
      suffixText,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const supportingTextId = `${inputId}-supporting`;

    const hasError = isError || !!errorMessage;
    const hasSupportingText = !!helperText || !!errorMessage;
    const displayedSupportingText = errorMessage ?? helperText;

    const wrapperClassName = uiClassName(styles.wrapper, isFullWidth && styles.isFullWidth, className);

    const inputWrapperClassName = uiClassName(
      styles.inputWrapper,
      VARIANT_MAP[variant],
      SIZE_MAP[size],
      hasError && styles.stateError,
      isSuccess && !hasError && styles.stateSuccess,
      isDisabled && styles.isDisabled,
      isReadOnly && styles.isReadOnly,
    );

    const sharedInputProps = {
      ...props,
      id: inputId,
      disabled: isDisabled,
      readOnly: isReadOnly,
      'aria-invalid': hasError ? (true as const) : undefined,
      'aria-describedby': hasSupportingText ? supportingTextId : undefined,
      className: uiClassName(styles.input, isMultiline && styles.inputMultiline),
    };

    return (
      <div className={wrapperClassName}>
        {label && (
          <Text variant="label" as="label" htmlFor={inputId} className={styles.label}>
            {label}
          </Text>
        )}
        <div className={inputWrapperClassName}>
          {leadingIcon && (
            <span className={styles.leadingIcon}>{renderIcon(leadingIcon)}</span>
          )}
          {prefixText && <span className={styles.prefixText}>{prefixText}</span>}
          {isMultiline ? (
            <textarea
              ref={ref as unknown as React.Ref<HTMLTextAreaElement>}
              rows={minRows}
              {...(sharedInputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input ref={ref} type="text" {...sharedInputProps} />
          )}
          {suffixText && <span className={styles.suffixText}>{suffixText}</span>}
          {trailingIcon && (
            <span className={styles.trailingIcon}>{renderIcon(trailingIcon)}</span>
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

TextField.displayName = 'TextField';
