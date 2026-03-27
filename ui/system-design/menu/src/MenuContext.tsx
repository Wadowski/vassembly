import { createContext, useContext } from 'react';
import type { MenuSelectionMode } from './types';

export type MenuContextValue = {
  mode: MenuSelectionMode;
  selectedKeys: string[];
  openKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  onOpenKeysChange: (keys: string[]) => void;
  announce: (message: string) => void;
  registerItem: (itemKey: string, element: HTMLElement) => void;
  unregisterItem: (itemKey: string) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export const useMenuContext = (): MenuContextValue => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within Menu');
  }
  return context;
};

export { MenuContext };
