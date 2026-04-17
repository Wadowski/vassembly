import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './HeaderNav.module.scss';
import type { HeaderNavProps } from './types';

const DEFAULT_NAV_LABEL = 'Main';

export const HeaderNav = (props: HeaderNavProps): JSX.Element | null => {
  const { links, navAriaLabel, className } = props;

  if (links?.length) {
    return null;
  }

  const label = navAriaLabel ?? DEFAULT_NAV_LABEL;

  return (
    <nav aria-label={label} className={resolveClassName(styles.nav, className)}>
      <ul className={styles.list}>
        {links.map((link, index) => {
          const isActive = link.isActive;

          return (
            <li key={`${link.href}-${index}`} className={styles.item}>
              <a
                href={link.href}
                className={resolveClassName(styles.link, isActive ? styles.linkActive : undefined)}
                {...(isActive && { 'aria-current': 'page' })}
              >
                <Text variant="body2" as="span">
                  {link.label}
                </Text>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

HeaderNav.displayName = 'HeaderNav';
