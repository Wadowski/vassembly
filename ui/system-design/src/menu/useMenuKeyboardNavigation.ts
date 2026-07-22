import { useCallback } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

type UseMenuKeyboardNavigationArgs = {
  menuRef: RefObject<HTMLElement | null>;
  openKeys?: string[];
  onOpenKeysChange?: (keys: string[]) => void;
};

const getInteractiveElements = ({ menu }: { menu: HTMLElement }): HTMLElement[] => {
  return [...menu.querySelectorAll<HTMLElement>('[data-menu-interactive="true"]')];
};

export const useMenuKeyboardNavigation = ({
  menuRef,
  openKeys = [],
  onOpenKeysChange = () => {},
}: UseMenuKeyboardNavigationArgs): ((event: KeyboardEvent<HTMLElement>) => void) => {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const menu = menuRef.current;
      if (!menu) {
        return;
      }
      const interactiveItems = getInteractiveElements({ menu }).filter(
        (item) =>
          item.getAttribute('aria-disabled') !== 'true' &&
          !item.hasAttribute('disabled') &&
          item.closest('[inert]') === null,
      );
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusedIndex = activeElement ? interactiveItems.indexOf(activeElement) : -1;
      if (event.key === 'ArrowDown' && focusedIndex >= 0) {
        event.preventDefault();
        interactiveItems[(focusedIndex + 1) % interactiveItems.length]?.focus();
      }
      if (event.key === 'ArrowUp' && focusedIndex >= 0) {
        event.preventDefault();
        interactiveItems[(focusedIndex - 1 + interactiveItems.length) % interactiveItems.length]?.focus();
      }
      if (event.key === 'Home' && interactiveItems.length > 0) {
        event.preventDefault();
        interactiveItems[0]?.focus();
      }
      if (event.key === 'End' && interactiveItems.length > 0) {
        event.preventDefault();
        interactiveItems[interactiveItems.length - 1]?.focus();
      }
      if (
        (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
        activeElement?.getAttribute('aria-haspopup') === 'menu'
      ) {
        event.preventDefault();
        const itemKey = activeElement.getAttribute('data-submenu-key');
        if (!itemKey) {
          return;
        }
        const isOpen = openKeys.includes(itemKey);
        if (event.key === 'ArrowRight' && !isOpen) {
          onOpenKeysChange([...openKeys, itemKey]);
        }
        if (event.key === 'ArrowLeft' && isOpen) {
          onOpenKeysChange(openKeys.filter((key) => key !== itemKey));
        }
      }
      if (event.key === 'Escape' && activeElement) {
        const parentPanel = activeElement.closest<HTMLElement>('[data-submenu-parent]');
        const submenuKey = parentPanel?.getAttribute('data-submenu-parent');
        if (!submenuKey || !openKeys.includes(submenuKey)) {
          return;
        }
        event.preventDefault();
        onOpenKeysChange(openKeys.filter((key) => key !== submenuKey));
        const trigger = menu.querySelector<HTMLElement>(`[data-submenu-key="${submenuKey}"]`);
        trigger?.focus();
      }
    },
    [menuRef, onOpenKeysChange, openKeys],
  );
};
