import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { Menu, MenuDivider, MenuGroup, MenuItem, SubMenu } from './index';

type RenderMenuOptions = {
  mode?: 'single' | 'multiple';
  selectedKeys?: string[];
  openKeys?: string[];
  onSelectedKeysChange?: (keys: string[]) => void;
  onOpenKeysChange?: (keys: string[]) => void;
  ariaLabel?: string;
};

const renderMenu = ({
  mode = 'single',
  selectedKeys = [],
  openKeys = [],
  onSelectedKeysChange = vi.fn(),
  onOpenKeysChange = vi.fn(),
  ariaLabel,
}: RenderMenuOptions = {}) => {
  return {
    onSelectedKeysChange,
    onOpenKeysChange,
    ...render(
      <Menu
        mode={mode}
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onSelectedKeysChange={onSelectedKeysChange}
        onOpenKeysChange={onOpenKeysChange}
        ariaLabel={ariaLabel}
      >
        <MenuItem itemKey="item-1">Item 1</MenuItem>
        <MenuItem itemKey="item-2">Item 2</MenuItem>
        <SubMenu itemKey="tools" title="Tools">
          <MenuItem itemKey="tool-a">Tool A</MenuItem>
          <MenuItem itemKey="tool-b">Tool B</MenuItem>
        </SubMenu>
      </Menu>,
    ),
  };
};

describe('Menu', () => {
  describe('rendering', () => {
    it('should render with role menu on root element', () => {
      renderMenu();
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should render aria-label on root element when ariaLabel prop provided', () => {
      renderMenu({ ariaLabel: 'Main menu' });
      expect(screen.getByRole('menu', { name: 'Main menu' })).toBeInTheDocument();
    });

    it('should render MenuItem without href as button element', () => {
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <MenuItem itemKey="item-1">Item 1</MenuItem>
        </Menu>,
      );
      expect(screen.getByRole('button', { name: 'Item 1' })).toBeInTheDocument();
    });

    it('should render MenuItem with href as anchor element with correct href', () => {
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <MenuItem itemKey="item-1" href="/docs">
            Docs
          </MenuItem>
        </Menu>,
      );
      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    });

    it('should render MenuGroup with role group', () => {
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <MenuGroup title="Actions">
            <MenuItem itemKey="item-1">Item 1</MenuItem>
          </MenuGroup>
        </Menu>,
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should render MenuDivider with role separator', () => {
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <MenuItem itemKey="item-1">Item 1</MenuItem>
          <MenuDivider />
        </Menu>,
      );
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should call onSelectedKeysChange with only clicked key in single mode', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      renderMenu({ mode: 'single', selectedKeys: ['item-2'], onSelectedKeysChange });

      await user.click(screen.getByRole('button', { name: 'Item 1' }));
      expect(onSelectedKeysChange).toHaveBeenCalledWith(['item-1']);
    });

    it('should add key to selectedKeys when clicking unselected item in multiple mode', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      renderMenu({ mode: 'multiple', selectedKeys: ['item-1'], onSelectedKeysChange });

      await user.click(screen.getByRole('button', { name: 'Item 2' }));
      expect(onSelectedKeysChange).toHaveBeenCalledWith(['item-1', 'item-2']);
    });

    it('should remove key from selectedKeys when clicking selected item in multiple mode', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      renderMenu({ mode: 'multiple', selectedKeys: ['item-1', 'item-2'], onSelectedKeysChange });

      await user.click(screen.getByRole('button', { name: 'Item 2' }));
      expect(onSelectedKeysChange).toHaveBeenCalledWith(['item-1']);
    });

    it('should apply selected css class when item key is in selectedKeys', () => {
      renderMenu({ selectedKeys: ['item-1'] });
      expect(screen.getByRole('button', { name: 'Item 1' }).className).toMatch(/\bselected\b/);
    });

    it('should not call onSelectedKeysChange when disabled item is clicked', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={onSelectedKeysChange} onOpenKeysChange={vi.fn()}>
          <MenuItem itemKey="item-1" isDisabled>
            Item 1
          </MenuItem>
        </Menu>,
      );

      await user.click(screen.getByRole('button', { name: 'Item 1' }));
      expect(onSelectedKeysChange).not.toHaveBeenCalled();
    });

    it('should not call onClick when disabled item is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={[]} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <MenuItem itemKey="item-1" isDisabled onClick={onClick}>
            Item 1
          </MenuItem>
        </Menu>,
      );

      await user.click(screen.getByRole('button', { name: 'Item 1' }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('submenu and openKeys', () => {
    it('should render submenu trigger with aria-haspopup menu', () => {
      renderMenu();
      expect(screen.getByRole('button', { name: 'Tools' })).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should render submenu trigger with aria-expanded false when key not in openKeys', () => {
      renderMenu({ openKeys: [] });
      expect(screen.getByRole('button', { name: 'Tools' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('should render submenu trigger with aria-expanded true when key is in openKeys', () => {
      renderMenu({ openKeys: ['tools'] });
      expect(screen.getByRole('button', { name: 'Tools' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should call onOpenKeysChange with key added when clicking submenu trigger', async () => {
      const user = userEvent.setup();
      const onOpenKeysChange = vi.fn();
      renderMenu({ openKeys: [], onOpenKeysChange });

      await user.click(screen.getByRole('button', { name: 'Tools' }));
      expect(onOpenKeysChange).toHaveBeenCalledWith(['tools']);
    });

    it('should support multiple submenus open simultaneously when openKeys has both keys', () => {
      render(
        <Menu mode="single" selectedKeys={[]} openKeys={['tools', 'settings']} onSelectedKeysChange={vi.fn()} onOpenKeysChange={vi.fn()}>
          <SubMenu itemKey="tools" title="Tools">
            <MenuItem itemKey="tool-a">Tool A</MenuItem>
          </SubMenu>
          <SubMenu itemKey="settings" title="Settings">
            <MenuItem itemKey="setting-a">Setting A</MenuItem>
          </SubMenu>
        </Menu>,
      );

      expect(screen.getByRole('button', { name: 'Tools' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render submenu panel content when key is in openKeys', () => {
      renderMenu({ openKeys: ['tools'] });
      expect(screen.getByText('Tool A')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should move focus to next interactive item on ArrowDown', async () => {
      const user = userEvent.setup();
      renderMenu();
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      const secondItem = screen.getByRole('button', { name: 'Item 2' });
      firstItem.focus();

      await user.keyboard('{ArrowDown}');
      expect(secondItem).toHaveFocus();
    });

    it('should move focus to previous interactive item on ArrowUp', async () => {
      const user = userEvent.setup();
      renderMenu();
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      const secondItem = screen.getByRole('button', { name: 'Item 2' });
      secondItem.focus();

      await user.keyboard('{ArrowUp}');
      expect(firstItem).toHaveFocus();
    });

    it('should move focus to first interactive item on Home', async () => {
      const user = userEvent.setup();
      renderMenu();
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      const secondItem = screen.getByRole('button', { name: 'Item 2' });
      secondItem.focus();

      await user.keyboard('{Home}');
      expect(firstItem).toHaveFocus();
    });

    it('should move focus to last interactive item on End', async () => {
      const user = userEvent.setup();
      renderMenu();
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      const submenuTrigger = screen.getByRole('button', { name: 'Tools' });
      firstItem.focus();

      await user.keyboard('{End}');
      expect(submenuTrigger).toHaveFocus();
    });

    it('should activate MenuItem on Enter and call selection callback', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      renderMenu({ mode: 'single', selectedKeys: [], onSelectedKeysChange });
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      firstItem.focus();

      await user.keyboard('{Enter}');
      expect(onSelectedKeysChange).toHaveBeenCalledWith(['item-1']);
    });

    it('should activate MenuItem on Space and call selection callback', async () => {
      const user = userEvent.setup();
      const onSelectedKeysChange = vi.fn();
      renderMenu({ mode: 'single', selectedKeys: [], onSelectedKeysChange });
      const firstItem = screen.getByRole('button', { name: 'Item 1' });
      firstItem.focus();

      await user.keyboard(' ');
      expect(onSelectedKeysChange).toHaveBeenCalledWith(['item-1']);
    });

    it('should open closed submenu on ArrowRight and call onOpenKeysChange', async () => {
      const user = userEvent.setup();
      const onOpenKeysChange = vi.fn();
      renderMenu({ openKeys: [], onOpenKeysChange });
      const submenuTrigger = screen.getByRole('button', { name: 'Tools' });
      submenuTrigger.focus();

      await user.keyboard('{ArrowRight}');
      expect(onOpenKeysChange).toHaveBeenCalledWith(['tools']);
    });

    it('should close open submenu on ArrowLeft and call onOpenKeysChange with key removed', async () => {
      const user = userEvent.setup();
      const onOpenKeysChange = vi.fn();
      renderMenu({ openKeys: ['tools'], onOpenKeysChange });
      const submenuTrigger = screen.getByRole('button', { name: 'Tools' });
      submenuTrigger.focus();

      await user.keyboard('{ArrowLeft}');
      expect(onOpenKeysChange).toHaveBeenCalledWith([]);
    });

    it('should close submenu on Escape from focused submenu item and return focus to trigger', async () => {
      const user = userEvent.setup();
      const onOpenKeysChange = vi.fn();
      renderMenu({ openKeys: ['tools'], onOpenKeysChange });
      const submenuTrigger = screen.getByRole('button', { name: 'Tools' });
      const submenuItem = screen.getByRole('button', { name: 'Tool A' });
      submenuItem.focus();

      await user.keyboard('{Escape}');
      expect(onOpenKeysChange).toHaveBeenCalledWith([]);
      expect(submenuTrigger).toHaveFocus();
    });
  });

  describe('live announcer', () => {
    it('should update live region text when selecting an item', async () => {
      const user = userEvent.setup();
      renderMenu({ mode: 'single', selectedKeys: [] });

      await user.click(screen.getByRole('button', { name: 'Item 1' }));
      expect(screen.getByRole('status')).toHaveTextContent(/item 1/i);
    });

    it('should update live region text when opening a submenu', async () => {
      const user = userEvent.setup();
      renderMenu({ openKeys: [] });

      await user.click(screen.getByRole('button', { name: 'Tools' }));
      expect(screen.getByRole('status')).toHaveTextContent(/tools/i);
    });
  });
});
