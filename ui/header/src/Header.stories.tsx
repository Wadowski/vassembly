import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'System Design/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Minimal: Story = {
  args: {
    logo: <span style={{ fontWeight: 600 }}>Vassembly</span>,
    onMenuPress: () => undefined,
  },
};

export const WithNavigation: Story = {
  args: {
    logo: <span style={{ fontWeight: 600 }}>Vassembly</span>,
    onMenuPress: () => undefined,
    navLinks: [
      { label: 'Home', href: '/', isActive: true },
      { label: 'Product', href: '/product' },
      { label: 'Docs', href: '/docs' },
    ],
  },
};

export const WithUtilitiesAndOpenState: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Header
        logo={<span style={{ fontWeight: 600 }}>Vassembly</span>}
        onMenuPress={() => setOpen((v) => !v)}
        isMenuOpen={open}
        menuSurfaceId="storybook-drawer"
        navLinks={[
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
        ]}
        utilitiesSlot={
          <button type="button" style={{ padding: '0 12px', height: 36 }}>
            Account
          </button>
        }
      />
    );
  },
};

export const Sticky: Story = {
  args: {
    logo: <span style={{ fontWeight: 600 }}>Vassembly</span>,
    onMenuPress: () => undefined,
    isSticky: true,
  },
};
