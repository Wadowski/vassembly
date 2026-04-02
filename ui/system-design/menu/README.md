# @vassembly/ui-menu

Controlled menu primitives for the Vassembly design system, including selectable items, nested submenus, groups, and dividers. Use this package when you need consistent application or contextual navigation patterns with keyboard support.

## Installation

```bash
pnpm add @vassembly/ui-menu
```

## Usage

```tsx
import { useState } from 'react';
import { Menu, MenuDivider, MenuGroup, MenuItem, SubMenu } from '@vassembly/ui-menu';

const ExampleMenu = (): JSX.Element => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['overview']);
  const [openKeys, setOpenKeys] = useState<string[]>(['settings']);

  return (
    <Menu
      mode="single"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onSelectedKeysChange={setSelectedKeys}
      onOpenKeysChange={setOpenKeys}
      ariaLabel="Project navigation"
    >
      <MenuGroup title="Main">
        <MenuItem itemKey="overview">Overview</MenuItem>
        <MenuItem itemKey="activity">Activity</MenuItem>
      </MenuGroup>

      <MenuDivider />

      <SubMenu itemKey="settings" title="Settings">
        <MenuItem itemKey="members">Members</MenuItem>
        <MenuItem itemKey="roles">Roles</MenuItem>
      </SubMenu>
    </Menu>
  );
};
```

## API Reference

### `Menu(props: MenuProps): JSX.Element`
Root controlled container for menu behavior, selection state, and submenu open state. Render `MenuItem`, `SubMenu`, `MenuGroup`, and `MenuDivider` as children.

```ts
type MenuSelectionMode = 'single' | 'multiple';

type MenuProps = {
  children?: ReactNode;
  mode: MenuSelectionMode;
  selectedKeys: string[];
  openKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  onOpenKeysChange: (keys: string[]) => void;
  ariaLabel?: string;
};
```

### `MenuItem(props: MenuItemProps): JSX.Element`
Selectable leaf item that renders as a `button` by default or as an anchor when `href` is provided. Supports disabled state, leading `icon`, trailing `suffix`, and item-level click handling.

```ts
type MenuBaseItem = {
  itemKey: string;
  isDisabled?: boolean;
  icon?: ReactNode;
  suffix?: ReactNode;
  className?: string;
};

type MenuItemProps = MenuBaseItem & {
  children: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};
```

### `SubMenu(props: SubMenuProps): JSX.Element`
Expandable menu section with a trigger (`title`) and nested content. Open/closed state is controlled by `openKeys` on `Menu`.

```ts
type SubMenuProps = MenuBaseItem & {
  title: ReactNode;
  children: ReactNode;
};
```

### `MenuGroup(props: MenuGroupProps): JSX.Element`
Structural wrapper to visually and semantically group related menu options, optionally with a group title.

```ts
type MenuGroupProps = {
  title?: ReactNode;
  children: ReactNode;
};
```

### `MenuDivider(props: MenuDividerProps): JSX.Element`
Visual separator between menu regions. Use `inset` when you want divider alignment with item text content.

```ts
type MenuDividerProps = { inset?: boolean };
```

## Controlled API Notes

- `Menu` is controlled-only: you must provide both state arrays (`selectedKeys`, `openKeys`) and both change handlers.
- In `mode="single"`, selecting a new item replaces the current selection; in `mode="multiple"`, selections are toggled in/out.
- Submenu expansion is fully controlled through `openKeys`; each `SubMenu` uses its `itemKey` as the open-state key.
- Always keep `itemKey` values unique across the full menu tree to avoid selection/open-state collisions.

## Dependencies

- `react`, `react-dom`: component rendering and hooks.
- `@vassembly/theme`: design tokens consumed by package styles.
- `@vassembly/ui-icons`: chevron on submenu triggers.
- `@vassembly/ui-text`: group titles use the `Text` component.
- `@vassembly/ui-utils`: shared UI helpers (class name resolution).
