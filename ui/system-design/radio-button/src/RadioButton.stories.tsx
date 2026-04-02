import type { Meta, StoryObj } from '@storybook/react';
import { RadioButton } from './RadioButton';

const meta: Meta<typeof RadioButton> = {
  title: 'System Design/RadioButton',
  component: RadioButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    label: 'Option A',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Option A',
  },
};

export const WithDescription: Story = {
  args: {
    checked: false,
    label: 'Email',
    description: 'Receive updates via email',
  },
};

export const WithError: Story = {
  args: {
    checked: false,
    label: 'Email',
    errorMessage: 'You must select an option',
  },
};

export const SuccessVariant: Story = {
  args: {
    checked: true,
    label: 'Email',
    variant: 'success',
    description: 'Looks good',
  },
};

export const VariantError: Story = {
  args: {
    checked: false,
    label: 'Email',
    variant: 'error',
  },
};

export const Disabled: Story = {
  args: {
    checked: true,
    label: 'Option A',
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    checked: true,
    label: 'Option A',
    isReadOnly: true,
  },
};

export const Required: Story = {
  args: {
    checked: false,
    label: 'Agree',
    isRequired: true,
  },
};

export const LabelLeft: Story = {
  args: {
    checked: false,
    label: 'Option A',
    labelPosition: 'left',
  },
};

export const Small: Story = {
  args: {
    checked: false,
    label: 'Small',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    checked: false,
    label: 'Large',
    size: 'large',
  },
};

export const NoLabel: Story = {
  args: {
    checked: false,
  },
};
