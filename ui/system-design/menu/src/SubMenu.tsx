import { useEffect, useId, useRef } from 'react';
import { ArrowDownIcon } from '@vassembly/ui-icons';
import { resolveClassName } from '@vassembly/ui-utils';
import { useMenuContext } from './MenuContext';
import styles from './Menu.module.scss';
import type { SubMenuProps } from './types';

export const SubMenu = ({
  itemKey,
  isDisabled = false,
  icon,
  suffix,
  className,
  title,
  children,
}: SubMenuProps): JSX.Element => {
  const { openKeys = [], onOpenKeysChange = () => {}, announce, registerItem, unregisterItem } = useMenuContext();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isOpen = openKeys.includes(itemKey);

  useEffect(() => {
    const element = triggerRef.current;
    if (!element) {
      return;
    }
    registerItem(itemKey, element);
    return () => unregisterItem(itemKey);
  }, [itemKey, registerItem, unregisterItem]);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) {
      return;
    }
    if (isOpen) {
      node.removeAttribute('inert');
      return;
    }

    node.setAttribute('inert', '');
  }, [isOpen]);

  const toggle = (): void => {
    if (isDisabled) {
      return;
    }
    const nextKeys = isOpen ? openKeys.filter((key) => key !== itemKey) : [...openKeys, itemKey];
    onOpenKeysChange(nextKeys);
    announce(`${String(title)} submenu ${isOpen ? 'closed' : 'opened'}`);
  };

  return (
    <div className={resolveClassName(styles.submenu, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={resolveClassName(styles.item, styles.submenuTrigger, isDisabled ? styles.disabled : undefined)}
        aria-disabled={isDisabled ? 'true' : undefined}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
        data-menu-interactive="true"
        data-submenu-key={itemKey}
        tabIndex={isDisabled ? -1 : 0}
        onClick={toggle}
      >
        {icon ? <span className={styles.itemIcon}>{icon}</span> : null}
        <span className={styles.itemLabel}>{title}</span>
        <span className={styles.itemTrailing}>
          {suffix ? <span className={styles.itemSuffix}>{suffix}</span> : null}
          <span aria-hidden="true" className={resolveClassName(styles.chevron, isOpen && styles.chevronOpen)}>
            <ArrowDownIcon />
          </span>
        </span>
      </button>
      <div
        id={panelId}
        role="group"
        className={resolveClassName(styles.submenuPanel, isOpen ? styles.submenuPanelOpen : undefined)}
      >
        <div className={styles.submenuPanelInner}>
          <div
            ref={regionRef}
            data-submenu-parent={itemKey}
            aria-hidden={!isOpen}
            className={resolveClassName(styles.submenuNested, isOpen && styles.submenuNestedOpen)}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
