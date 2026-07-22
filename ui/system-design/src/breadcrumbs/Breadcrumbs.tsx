import type { ComponentPropsWithoutRef } from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Breadcrumbs.module.scss';
import type { BreadcrumbItem, BreadcrumbsProps } from './types';

type BreadcrumbBodyTextProps = Omit<ComponentPropsWithoutRef<typeof Text>, 'variant' | 'as'>;

const BreadcrumbBodyText = (props: BreadcrumbBodyTextProps): JSX.Element => {
  return <Text variant="body2" as="span" {...props} />;
};

const BreadcrumbItemContent = (props: {
  item: BreadcrumbItem;
  isLast: boolean;
}): JSX.Element => {
  const { item, isLast } = props;

  if (isLast) {
    return (
      <BreadcrumbBodyText aria-current="page" className={styles.current}>
        {item.label}
      </BreadcrumbBodyText>
    );
  }

  if (item.href) {
    return (
      <a href={item.href} className={styles.link}>
        <BreadcrumbBodyText>{item.label}</BreadcrumbBodyText>
      </a>
    );
  }

  return (
    <span>
      <BreadcrumbBodyText>{item.label}</BreadcrumbBodyText>
    </span>
  );
};

export const Breadcrumbs = (props: BreadcrumbsProps): JSX.Element | null => {
  const { items, separator = '/' } = props;

  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className={resolveClassName(styles.wrapper)}>
      <ol className={styles.list}>
        {items.map((item: BreadcrumbItem, index: number) => {
          const isLast: boolean = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              <BreadcrumbItemContent item={item} isLast={isLast} />
              {!isLast && (
                <span aria-hidden="true" className={styles.separator}>
                  <Text variant="caption" as="span">
                    {separator}
                  </Text>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';
