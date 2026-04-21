import { useEffect, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import { useMenuContext } from './MenuContext';
import styles from './Menu.module.scss';
import type { MenuItemProps } from './types';
import { getNextSelectedKeys } from './useMenuSelection';

const getTextContent = ({ node }: { node: HTMLElement | null }): string => {
  return node?.textContent?.trim() ?? '';
};

export const MenuItem = ({
  itemKey,
  isDisabled = false,
  icon,
  suffix,
  className,
  children,
  href,
  target,
  rel,
  onClick,
}: MenuItemProps): JSX.Element => {
  const { mode, selectedKeys = [], onSelectedKeysChange, announce, registerItem, unregisterItem } =
    useMenuContext();
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const isSelected = selectedKeys.includes(itemKey);
  const safeRel = target === '_blank' ? [rel, 'noopener', 'noreferrer'].filter(Boolean).join(' ') : rel;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    registerItem(itemKey, element);
    return () => unregisterItem(itemKey);
  }, [itemKey, registerItem, unregisterItem]);

  const handleInteraction = (event: MouseEvent<HTMLElement>): void => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    const nextKeys = getNextSelectedKeys({ mode, selectedKeys, itemKey });
    onSelectedKeysChange?.(nextKeys);
    onClick?.(event);
    announce(`${getTextContent({ node: ref.current })} selected`);
  };

  const mergedClassName = resolveClassName(
    styles.item,
    isSelected ? styles.selected : undefined,
    isSelected ? 'selected' : undefined,
    isDisabled ? styles.disabled : undefined,
    className,
  );

  const content = (
    <>
      {icon ? <span className={styles.itemIcon}>{icon}</span> : null}
      <span className={styles.itemLabel}>{children}</span>
      {suffix ? <span className={styles.itemSuffix}>{suffix}</span> : null}
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={safeRel}
        className={mergedClassName}
        aria-disabled={isDisabled ? 'true' : undefined}
        data-menu-interactive="true"
        tabIndex={isDisabled ? -1 : 0}
        onClick={(event) => handleInteraction(event as MouseEvent<HTMLElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as RefObject<HTMLButtonElement>}
      type="button"
      className={mergedClassName}
      aria-disabled={isDisabled ? 'true' : undefined}
      disabled={isDisabled}
      data-menu-interactive="true"
      tabIndex={isDisabled ? -1 : 0}
      onClick={(event) => handleInteraction(event as MouseEvent<HTMLElement>)}
    >
      {content}
    </button>
  );
};
