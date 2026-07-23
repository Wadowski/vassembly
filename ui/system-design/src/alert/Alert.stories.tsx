import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import type { AlertVariant } from './types';

const meta: Meta<typeof Alert> = {
  title: 'System Design/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onExpandedChange: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This is an informational alert.',
    variant: 'info',
    showIcon: false,
  },
};

export const WithDefaultIcon: Story = {
  args: {
    message: 'Your changes were saved.',
    variant: 'success',
    showIcon: true,
  },
};

export const CustomIcon: Story = {
  args: {
    message: 'Custom star icon instead of the default.',
    variant: 'info',
    showIcon: true,
    icon: <span aria-hidden="true">★</span>,
  },
};

export const WithDetails: Story = {
  args: {
    message: 'Update available.',
    variant: 'info',
    details: 'Version 2.0 includes security fixes and performance improvements.',
    showIcon: true,
  },
};

export const Collapsible: Story = {
  args: {
    message: 'Payment could not be processed.',
    variant: 'warning',
    details: 'The card was declined. Try another payment method or contact your bank.',
    isCollapsible: true,
    showIcon: true,
    defaultIsExpanded: false,
  },
};

const variantStories: { name: string; variant: AlertVariant }[] = [
  { name: 'Info', variant: 'info' },
  { name: 'Success', variant: 'success' },
  { name: 'Warning', variant: 'warning' },
  { name: 'Error', variant: 'error' },
];

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 'min(480px, 100%)' }}>
      {variantStories.map(({ name, variant }) => (
        <Alert key={variant} message={`${name} variant`} variant={variant} showIcon />
      ))}
    </div>
  ),
};
