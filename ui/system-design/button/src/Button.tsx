import { forwardRef } from 'react';
import Link from 'next/link';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
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
      as = 'button',
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
    const Component = as === 'a' ? 'a' : as === Link ? Link : 'button';
    const isButtonDisabled = isDisabled || isLoading;

    const buttonClassName = resolveClassName(
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

    const buttonContent = (
      <>
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
      </>
    );

    if (Component === 'button') {
      return (
        <button
          ref={ref}
          className={buttonClassName}
          disabled={isButtonDisabled}
          type="button"
          {...props}
        >
          {buttonContent}
        </button>
      );
    }

    if (Component === 'a') {
      return (
        <a
          ref={ref}
          className={buttonClassName}
          aria-disabled={isButtonDisabled}
          {...props}
        >
          {buttonContent}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        className={buttonClassName}
        aria-disabled={isButtonDisabled}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  },
);

Button.displayName = 'Button';
