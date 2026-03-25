import { forwardRef } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './Button.module.scss';
import { ButtonProps } from './types';

const COLOR_MAP = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  tertiary: styles.colorTertiary,
  danger: styles.colorDanger,
};

const VARIANT_MAP = {
  contained: styles.variantContained,
  outlined: styles.variantOutlined,
  text: styles.variantText,
};

const SIZE_MAP = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      color = 'primary',
      variant = 'contained',
      size = 'medium',
      isDisabled = false,
      isLoading = false,
      isFullWidth = false,
      icon: IconComponent,
      iconPosition = 'left',
      text,
      textVariant = 'label',
      className,
      ...props
    },
    ref,
  ) => {
    const isButtonDisabled = isDisabled || isLoading;

    const buttonClassName = uiClassName(
      styles.button,
      COLOR_MAP[color],
      VARIANT_MAP[variant],
      SIZE_MAP[size],
      isButtonDisabled && styles.disabled,
      isLoading && styles.loading,
      isFullWidth && styles.fullWidth,
      className,
    );

    const renderIcon = () => {
      if (!IconComponent) return null;
      if (typeof IconComponent === 'function') {
        return <IconComponent />;
      }
      return IconComponent;
    };

    return (
      <button
        ref={ref}
        className={buttonClassName}
        disabled={isButtonDisabled}
        type="button"
        {...props}
      >
        {isLoading && <div className={styles.loading} />} {/* TODO: Add spinner */}
        {!isLoading && IconComponent && iconPosition === 'left' && (
          <span className={styles.icon}>{renderIcon()}</span>
        )}
        <span className={styles.content}>
          <Text variant={textVariant} as="span" className={styles.buttonLabel}>
            {text}
          </Text>
        </span>
        {!isLoading && IconComponent && iconPosition === 'right' && (
          <span className={styles.icon}>{renderIcon()}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
