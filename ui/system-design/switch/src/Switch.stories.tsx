import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'System Design/Switch',
  component: Switch,
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
    label: 'Notifications',
    isChecked: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'Notifications',
    isChecked: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Notifications',
    helperText: 'You can change this later',
  },
};

export const WithError: Story = {
  args: {
    label: 'Notifications',
    errorMessage: 'Something went wrong',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Notifications',
    isDisabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Notifications',
    isDisabled: true,
    isChecked: true,
  },
};

export const Loading: Story = {
  args: {
    label: 'Notifications',
    isLoading: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Notifications',
    isReadOnly: true,
    isChecked: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Notifications',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    label: 'Notifications',
    size: 'large',
  },
};

export const NoLabel: Story = {
  args: {},
};
