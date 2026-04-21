import type { MouseEvent, ReactNode } from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import type { DrawerNavigateEvent, NavLinkItem } from '../types';
import styles from './NavLinkRow.module.scss';

export interface NavLinkRowProps {
  item: NavLinkItem;
  isActive: boolean;
  isNested?: boolean;
  LinkComponent?: React.ComponentType<{ href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void; className: string; children: ReactNode; target?: string; rel?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean }>;
  onNavigate: (event: DrawerNavigateEvent) => void;
}

const buildInner = (args: { item: NavLinkItem }): ReactNode => {
  const { item } = args;
  const Icon = item.icon;
  return (
    <>
      <span className={styles.icon} aria-hidden>
        {Icon && <Icon />}
      </span>
      <span className={styles.label}>{item.label}</span>
      {item.badge && (
        <span className={styles.badge} aria-label={item.badge.ariaLabel}>
          {item.badge.value}
        </span>
      )}
    </>
  );
};

export const NavLinkRow = (props: NavLinkRowProps): JSX.Element => {
  const { item, isActive, isNested = false, onNavigate, LinkComponent } = props;

  const Link = LinkComponent || 'a';

  const rowClass = resolveClassName(
    styles.row,
    isNested && styles.rowNested,
    isActive && styles.rowActive,
    item.isDisabled && styles.rowDisabled,
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (item.isDisabled) {
      event.preventDefault();
      return;
    }
    if (!item.isExternal) {
      event.preventDefault();
    }
    onNavigate({ href: item.href, itemId: item.id, reason: 'link' });
  };

  const inner = buildInner({ item });

  return (
    <Link
      href={item.href}
      className={rowClass}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      target={item.isExternal ? '_blank' : undefined}
      rel={item.isExternal ? 'noopener noreferrer' : undefined}
    >
      {inner}
    </Link>
  );
};

NavLinkRow.displayName = 'NavLinkRow';
