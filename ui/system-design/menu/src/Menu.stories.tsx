import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CheckIcon, SearchIcon } from '@vassembly/ui-icons';
import { Menu } from './Menu';
import { MenuDivider } from './MenuDivider';
import { MenuGroup } from './MenuGroup';
import { MenuItem } from './MenuItem';
import { SubMenu } from './SubMenu';

const meta: Meta<typeof Menu> = {
  title: 'System Design/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const surfaceStyle = {
  width: '18rem',
  padding: '0.75rem',
  background: '#1a1a1e',
};

export const Default: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['dashboard']);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Default menu"
        >
          <MenuItem itemKey="dashboard">Dashboard</MenuItem>
          <MenuItem itemKey="projects">Projects</MenuItem>
          <MenuItem itemKey="settings">Settings</MenuItem>
        </Menu>
      </div>
    );
  },
};

export const MultipleSelection: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['comments']);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const getSuffix = ({ isSelected }: { isSelected: boolean }): JSX.Element | null => {
      if (!isSelected) {
        return null;
      }
      return <CheckIcon />;
    };

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="multiple"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Multiple selection menu"
        >
          <MenuItem
            itemKey="comments"
            suffix={getSuffix({ isSelected: selectedKeys.includes('comments') })}
          >
            Comments
          </MenuItem>
          <MenuItem
            itemKey="mentions"
            suffix={getSuffix({ isSelected: selectedKeys.includes('mentions') })}
          >
            Mentions
          </MenuItem>
          <MenuItem
            itemKey="follows"
            suffix={getSuffix({ isSelected: selectedKeys.includes('follows') })}
          >
            Follows
          </MenuItem>
        </Menu>
      </div>
    );
  },
};

export const WithSubMenus: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['users']);
    const [openKeys, setOpenKeys] = useState<string[]>(['management', 'workspace']);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Menu with submenus"
        >
          <MenuItem itemKey="home">Home</MenuItem>
          <SubMenu itemKey="management" title="Management">
            <MenuItem itemKey="users">Users</MenuItem>
            <MenuItem itemKey="teams">Teams</MenuItem>
          </SubMenu>
          <SubMenu itemKey="workspace" title="Workspace">
            <MenuItem itemKey="members">Members</MenuItem>
            <MenuItem itemKey="invites">Invites</MenuItem>
          </SubMenu>
        </Menu>
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['search']);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Menu with icons"
        >
          <MenuItem itemKey="search" icon={<SearchIcon />} suffix={<CheckIcon />}>
            Search
          </MenuItem>
          <MenuItem itemKey="filters" icon={<SearchIcon />} suffix={<span>Cmd+F</span>}>
            Filters
          </MenuItem>
          <MenuItem itemKey="saved" icon={<CheckIcon />} suffix={<span>12</span>}>
            Saved Views
          </MenuItem>
        </Menu>
      </div>
    );
  },
};

export const WithGroups: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['profile']);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Menu with groups"
        >
          <MenuGroup title="Account">
            <MenuItem itemKey="profile">Profile</MenuItem>
            <MenuItem itemKey="security">Security</MenuItem>
          </MenuGroup>
          <MenuDivider inset />
          <MenuGroup title="Workspace">
            <MenuItem itemKey="members">Members</MenuItem>
            <MenuItem itemKey="billing">Billing</MenuItem>
          </MenuGroup>
        </Menu>
      </div>
    );
  },
};

export const WithLinks: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['docs']);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Menu links"
        >
          <MenuItem itemKey="docs" href="https://example.com/docs" target="_blank">
            Documentation
          </MenuItem>
          <MenuItem itemKey="api" href="https://example.com/api" target="_blank">
            API Reference
          </MenuItem>
          <MenuItem itemKey="status" href="https://example.com/status" target="_blank">
            Status Page
          </MenuItem>
        </Menu>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['general']);
    const [openKeys, setOpenKeys] = useState<string[]>(['advanced']);

    return (
      <div style={surfaceStyle}>
        <Menu
          mode="single"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelectedKeysChange={setSelectedKeys}
          onOpenKeysChange={setOpenKeys}
          ariaLabel="Disabled menu options"
        >
          <MenuItem itemKey="general">General</MenuItem>
          <MenuItem itemKey="billing" isDisabled>
            Billing (Unavailable)
          </MenuItem>
          <SubMenu itemKey="advanced" title="Advanced" isDisabled>
            <MenuItem itemKey="beta">Beta Flags</MenuItem>
          </SubMenu>
        </Menu>
      </div>
    );
  },
};
