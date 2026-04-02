import { forwardRef } from 'react';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './AnchorList.module.scss';
import type { AnchorListProps, AnchorListItem } from './types';

const SIZE_MAP: Record<NonNullable<AnchorListProps['size']>, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const AnchorList = forwardRef<HTMLElement, AnchorListProps>(
  (
    {
      items,
      activeHref,
      size = 'medium',
      isDisabled = false,
      onItemClick,
      ariaLabel = 'Anchor list',
    },
    ref,
  ) => {
    const sizeClass = SIZE_MAP[size];

    const handleClick = (item: AnchorListItem): void => {
      if (isDisabled || !onItemClick) return;
      onItemClick(item);
    };

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={resolveClassName(isDisabled && styles.isDisabled)}
      >
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.href} className={styles.item}>
              <a
                href={item.href}
                className={resolveClassName(
                  styles.link,
                  sizeClass,
                  item.href === activeHref && styles.isActive,
                )}
                onClick={() => handleClick(item)}
              >
                <Text variant="body1" as="span">
                  {item.label}
                </Text>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  },
);

AnchorList.displayName = 'AnchorList';
