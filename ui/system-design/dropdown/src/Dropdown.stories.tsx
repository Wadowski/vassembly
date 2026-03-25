import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dropdown } from './Dropdown';

const sampleOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const meta: Meta<typeof Dropdown> = {
  title: 'System Design/Dropdown',
  component: Dropdown,
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
    label: 'Choose',
    placeholder: 'Select an option',
    options: sampleOptions,
  },
};

export const Small: Story = {
  args: {
    label: 'Size',
    options: sampleOptions,
    size: 'small',
    placeholder: 'Small',
  },
};

export const Large: Story = {
  args: {
    label: 'Size',
    options: sampleOptions,
    size: 'large',
    placeholder: 'Large',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full width',
    options: sampleOptions,
    isFullWidth: true,
    placeholder: 'Select',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    options: sampleOptions,
    isDisabled: true,
    value: 'b',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <Dropdown
        label="Controlled"
        options={sampleOptions}
        value={value}
        onValueChange={setValue}
      />
    );
  },
};
