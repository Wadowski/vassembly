import { Text } from '@vassembly/ui-text';
import { className as cn } from '@vassembly/ui-utils';
import styles from './Breadcrumbs.module.scss';
import type { BreadcrumbItem, BreadcrumbsProps } from './types';

export const Breadcrumbs = (props: BreadcrumbsProps): JSX.Element | null => {
  const { items, separator = '/' } = props;

  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className={cn(styles.wrapper)}>
      <ol className={styles.list}>
        {items.map((item: BreadcrumbItem, index: number) => {
          const isLast: boolean = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {isLast ? (
                <Text variant="body2" as="span" aria-current="page" className={styles.current}>
                  {item.label}
                </Text>
              ) : item.href ? (
                <a href={item.href} className={styles.link}>
                  <Text variant="body2" as="span">
                    {item.label}
                  </Text>
                </a>
              ) : (
                <span>
                  <Text variant="body2" as="span">
                    {item.label}
                  </Text>
                </span>
              )}
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
