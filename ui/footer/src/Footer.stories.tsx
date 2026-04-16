import {
  SocialFacebookMonoIcon,
  SocialInstagramMonoIcon,
  SocialTwitterMonoIcon,
  SocialYoutubeMonoIcon,
} from '@vassembly/ui-icons';
import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'System Design/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: {
      tagline: 'Built for clarity and speed.',
    },
    sitemap: [
      { label: 'Home', href: '/' },
      { label: 'Product', href: '/product' },
      { label: 'Pricing', href: '/pricing' },
    ],
    company: [{ label: 'About us', href: '/about' }],
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms & conditions', href: '/terms' },
    ],
    contact: {
      email: { label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' },
      phone: { label: 'Phone', value: '+1 555 0100', href: 'tel:+15550100' },
      address: '123 Market St\nSan Francisco, CA',
    },
    social: [
      {
        href: 'https://twitter.com',
        ariaLabel: 'X',
        icon: <SocialTwitterMonoIcon />,
      },
      {
        href: 'https://youtube.com',
        ariaLabel: 'YouTube',
        icon: <SocialYoutubeMonoIcon />,
      },
      {
        href: 'https://facebook.com',
        ariaLabel: 'Facebook',
        icon: <SocialFacebookMonoIcon />,
      },
      {
        href: 'https://instagram.com',
        ariaLabel: 'Instagram',
        icon: <SocialInstagramMonoIcon />,
      },
    ],
    copyright: '© 2026 Example Inc. All rights reserved.',
  },
};

export const Minimal: Story = {
  args: {
    sitemap: [{ label: 'Home', href: '/' }],
    copyright: '© 2026 Example Inc.',
  },
};
