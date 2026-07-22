import type { Meta, StoryObj } from '@storybook/react';
import { AnchorList } from './AnchorList';

const ITEMS = [
  { label: 'Introduction', href: '#introduction' },
  { label: 'Getting Started', href: '#getting-started' },
  { label: 'Configuration', href: '#configuration' },
  { label: 'API Reference', href: '#api-reference' },
];

const meta: Meta<typeof AnchorList> = {
  title: 'System Design/AnchorList',
  component: AnchorList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: ITEMS,
  },
};

export const WithActiveItem: Story = {
  args: {
    items: ITEMS,
    activeHref: '#getting-started',
  },
};

export const Disabled: Story = {
  args: {
    items: ITEMS,
    activeHref: '#introduction',
    isDisabled: true,
  },
};

export const Small: Story = {
  args: {
    items: ITEMS,
    size: 'small',
    activeHref: '#introduction',
  },
};

export const Large: Story = {
  args: {
    items: ITEMS,
    size: 'large',
    activeHref: '#introduction',
  },
};

export const NoItems: Story = {
  args: {
    items: [],
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { label: 'Section 1', href: '#section-1' },
      { label: 'Section 2', href: '#section-2' },
      { label: 'Section 3', href: '#section-3' },
      { label: 'Section 4', href: '#section-4' },
      { label: 'Section 5', href: '#section-5' },
      { label: 'Section 6', href: '#section-6' },
      { label: 'Section 7', href: '#section-7' },
      { label: 'Section 8', href: '#section-8' },
    ],
    activeHref: '#section-4',
  },
};

export const WithClickHandler: Story = {
  args: {
    items: ITEMS,
    activeHref: '#introduction',
    onItemClick: (item) => alert(`Clicked: ${item.label}`),
  },
};
