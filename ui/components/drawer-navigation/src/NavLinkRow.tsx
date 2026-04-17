import type { MouseEvent, ReactNode } from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import type { DrawerNavigateEvent, NavLinkItem, RenderNavLinkArgs } from './types';
import styles from './NavLinkRow.module.scss';

export interface NavLinkRowProps {
  item: NavLinkItem;
  isActive: boolean;
  isNested?: boolean;
  onNavigate: (event: DrawerNavigateEvent) => void;
  renderLink?: (args: RenderNavLinkArgs) => ReactNode;
}

const buildInner = (args: { item: NavLinkItem }): ReactNode => {
  const { item } = args;
  const Icon = item.icon;
  return (
    <>
      {Icon && (
        <span className={styles.icon} aria-hidden>
          <Icon />
        </span>
      )}
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
  const { item, isActive, isNested = false, onNavigate, renderLink } = props;

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

  if (renderLink) {
    return renderLink({
      href: item.href,
      className: rowClass,
      children: inner,
      isExternal: item.isExternal,
      onClick: handleClick,
    }) as JSX.Element;
  }

  return (
    <a
      href={item.href}
      className={rowClass}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      target={item.isExternal ? '_blank' : undefined}
      rel={item.isExternal ? 'noopener noreferrer' : undefined}
    >
      {inner}
    </a>
  );
};

NavLinkRow.displayName = 'NavLinkRow';
