import { forwardRef, useId } from 'react';
import type React from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
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
      'aria-describedby': ariaDescribedByProp,
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

    const describedByParts = [ariaDescribedByProp, hasSupportingText ? supportingTextId : undefined].filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    );
    const mergedAriaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const wrapperClassName = resolveClassName(styles.wrapper, isFullWidth && styles.isFullWidth, className);

    const inputWrapperClassName = resolveClassName(
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
      'aria-describedby': mergedAriaDescribedBy,
      className: resolveClassName(styles.input, isMultiline && styles.inputMultiline),
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
          {prefixText && (
            <Text variant="body1" as="span" className={styles.prefixText}>
              {prefixText}
            </Text>
          )}
          {isMultiline ? (
            <textarea
              ref={ref as unknown as React.Ref<HTMLTextAreaElement>}
              rows={minRows}
              {...(sharedInputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input ref={ref} type="text" {...sharedInputProps} />
          )}
          {suffixText && (
            <Text variant="body1" as="span" className={styles.suffixText}>
              {suffixText}
            </Text>
          )}
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
