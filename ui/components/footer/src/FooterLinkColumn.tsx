import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Footer.module.scss';
import type { FooterLinkColumnProps } from './types';

export const FooterLinkColumn = (props: FooterLinkColumnProps): JSX.Element | null => {
  const { ariaLabel, title, links, className } = props;

  if (links.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className={resolveClassName(styles.column, className)}>
      <Text variant="label" as="p" className={styles.columnTitle}>
        {title}
      </Text>
      <ul className={styles.linkList}>
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`} className={styles.linkListItem}>
            <a href={link.href} className={styles.footerLink}>
              <Text variant="body2" as="span">
                {link.label}
              </Text>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

FooterLinkColumn.displayName = 'FooterLinkColumn';
