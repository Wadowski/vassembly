import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { Snackbar } from './Snackbar';
import { SnackbarProvider, useSnackbar } from '.';
import type { SnackbarVariant } from './types';

const meta: Meta<typeof Snackbar> = {
  title: 'System Design/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onDismiss: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const AutoShow = ({
  message,
  variant,
  duration,
  isDismissible,
}: {
  message: string;
  variant: SnackbarVariant;
  duration: number;
  isDismissible?: boolean;
}) => {
  const { show } = useSnackbar();

  useEffect(() => {
    show({
      message,
      variant,
      duration,
      isDismissible,
    });
  }, [duration, isDismissible, message, show, variant]);

  return null;
};

export const Default: Story = {
  args: {
    message: 'Notification',
    variant: 'info',
    isDismissible: false,
  },
};

export const Success: Story = {
  args: {
    message: 'Saved successfully',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    message: 'Check your input',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    message: 'Something went wrong',
    variant: 'error',
  },
};

export const Dismissible: Story = {
  args: {
    message: 'Dismiss me',
    variant: 'info',
    isDismissible: true,
    onDismiss: () => {},
  },
};

export const LongDuration: Story = {
  render: () => (
    <SnackbarProvider>
      <AutoShow message="Long duration" variant="info" duration={10000} isDismissible />
    </SnackbarProvider>
  ),
};

export const NoDuration: Story = {
  render: () => (
    <SnackbarProvider>
      <AutoShow message="Stays until dismissed" variant="warning" duration={0} isDismissible />
    </SnackbarProvider>
  ),
};

export const BottomRight: Story = {
  render: () => (
    <SnackbarProvider position="bottom-right">
      <AutoShow message="Bottom right" variant="success" duration={4000} />
    </SnackbarProvider>
  ),
};

export const WithProvider: Story = {
  render: () => {
    const Trigger = () => {
      const { show } = useSnackbar();

      return (
        <button
          type="button"
          onClick={() =>
            show({
              message: 'Action complete',
              variant: 'success',
              duration: 4000,
              isDismissible: true,
            })
          }
        >
          Show snackbar
        </button>
      );
    };

    return (
      <SnackbarProvider>
        <Trigger />
      </SnackbarProvider>
    );
  },
};

