import { useMemo, useRef, useState } from 'react';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { LiveAnnouncer } from './LiveAnnouncer';
import { MenuContext } from './MenuContext';
import styles from './Menu.module.scss';
import type { MenuProps } from './types';
import { useMenuKeyboardNavigation } from './useMenuKeyboardNavigation';

type Registry = Map<string, HTMLElement>;

export const Menu = ({
  children,
  mode,
  selectedKeys = [],
  openKeys = [],
  onSelectedKeysChange = () => {},
  onOpenKeysChange = () => {},
  ariaLabel,
}: MenuProps): JSX.Element => {
  const [announcement, setAnnouncement] = useState<string>('');
  const menuRef = useRef<HTMLElement>(null);
  const registryRef = useRef<Registry>(new Map());
  const onKeyDown = useMenuKeyboardNavigation({ menuRef, openKeys, onOpenKeysChange });

  const contextValue = useMemo(
    () => ({
      mode,
      selectedKeys,
      openKeys,
      onSelectedKeysChange,
      onOpenKeysChange,
      announce: (message: string): void => setAnnouncement(message),
      registerItem: (itemKey: string, element: HTMLElement): void => {
        registryRef.current.set(itemKey, element);
      },
      unregisterItem: (itemKey: string): void => {
        registryRef.current.delete(itemKey);
      },
    }),
    [mode, onOpenKeysChange, onSelectedKeysChange, openKeys, selectedKeys],
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <nav
        ref={menuRef}
        role="menu"
        aria-label={ariaLabel ?? 'Menu'}
        className={resolveClassName(styles.root)}
        onKeyDown={onKeyDown}
      >
        {children}
      </nav>
      <LiveAnnouncer message={announcement} />
    </MenuContext.Provider>
  );
};
