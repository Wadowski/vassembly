import type { Meta, StoryObj } from '@storybook/react';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Components/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'filled'],
    },
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
    label: 'Email',
    placeholder: 'you@example.com',
    helperText: "We'll never share your email",
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Username',
    placeholder: 'Enter username',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Username',
    placeholder: 'Enter username',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Small Field',
    placeholder: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Large Field',
    placeholder: 'Large',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    errorMessage: 'Please enter a valid email address',
  },
};

export const WithSuccess: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    isSuccess: true,
    helperText: 'Username is available',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    placeholder: 'Cannot edit',
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read Only',
    value: 'Cannot be changed',
    isReadOnly: true,
  },
};

export const WithPrefixSuffix: Story = {
  args: {
    label: 'Price',
    placeholder: '0.00',
    prefixText: '$',
    suffixText: 'USD',
  },
};

export const Multiline: Story = {
  args: {
    label: 'Message',
    placeholder: 'Write your message...',
    isMultiline: true,
    minRows: 4,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width',
    placeholder: 'Stretches to fill container',
    isFullWidth: true,
  },
  decorators: [
    (StoryComponent) => (
      <div style={{ width: '400px' }}>
        <StoryComponent />
      </div>
    ),
  ],
};
