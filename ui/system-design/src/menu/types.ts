import type { MouseEventHandler, ReactNode } from 'react';

export type MenuSelectionMode = 'single' | 'multiple';

export type MenuBaseItem = {
  itemKey: string;
  isDisabled?: boolean;
  icon?: ReactNode;
  suffix?: ReactNode;
  className?: string;
};

export type MenuProps = {
  children?: ReactNode;
  mode: MenuSelectionMode;
  selectedKeys?: string[];
  openKeys?: string[];
  onSelectedKeysChange?: (keys: string[]) => void;
  onOpenKeysChange?: (keys: string[]) => void;
  ariaLabel?: string;
};

export type MenuItemProps = MenuBaseItem & {
  children: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export type SubMenuProps = MenuBaseItem & {
  title: ReactNode;
  children: ReactNode;
};

export type MenuGroupProps = {
  title?: ReactNode;
  children: ReactNode;
};

export type MenuDividerProps = { inset?: boolean };
