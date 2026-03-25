import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs } from './Tabs';

const sampleItems = [
  { label: 'Tab A', value: 'a' },
  { label: 'Tab B', value: 'b' },
  { label: 'Tab C', value: 'c', isDisabled: true },
];

const meta: Meta<typeof Tabs> = {
  title: 'System Design/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: sampleItems,
    activeTab: 'a',
  },
};

export const Controlled: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<string>('a');

    return <Tabs items={sampleItems} activeTab={activeTab} onChange={setActiveTab} />;
  },
};

