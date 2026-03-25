import type { ReactNode } from 'react';
import { Text } from '@vassembly/ui-text';
import { className as cn } from '@vassembly/ui-utils';
import styles from './Tag.module.scss';
import type { TagProps, TagSize, TagVariant } from './types';

const SIZE_MAP: Record<TagSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

const VARIANT_MAP: Record<TagVariant, string> = {
  default: styles.stateDefault,
  primary: styles.statePrimary,
  success: styles.stateSuccess,
  warning: styles.stateWarning,
  error: styles.stateError,
};

const renderIcon = (icon: ReactNode): ReactNode => {
  if (icon === null || icon === undefined) return null;
  return icon;
};

export const Tag = ({
  children,
  variant = 'default',
  size = 'medium',
  onRemove,
  removeLabel = 'Remove',
  icon,
  className,
  ...rest
}: TagProps): JSX.Element => {
  const variantClassName = VARIANT_MAP[variant];
  const sizeClassName = SIZE_MAP[size];

  const handleRemove = (): void => {
    if (!onRemove) return;
    onRemove();
  };

  return (
    <span className={cn(styles.tag, variantClassName, sizeClassName, className)} {...rest}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {renderIcon(icon)}
        </span>
      )}
      <Text variant="label" as="span" className={styles.label}>
        {children}
      </Text>
      {onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          aria-label={removeLabel}
          onClick={handleRemove}
        >
          <Text variant="caption" as="span" className={styles.removeIcon} aria-hidden="true">
            x
          </Text>
        </button>
      )}
    </span>
  );
};

Tag.displayName = 'Tag';

