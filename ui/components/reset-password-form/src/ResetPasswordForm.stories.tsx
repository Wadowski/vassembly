import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-snackbar';
import { ResetPasswordForm } from './ResetPasswordForm';

const meta: Meta<typeof ResetPasswordForm> = {
  title: 'Components/ResetPasswordForm',
  component: ResetPasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (story) => (
      <HttpClientProvider config={{ baseUrl: 'http://localhost:5000' }}>
        <SnackbarProvider position="bottom-left">{story()}</SnackbarProvider>
      </HttpClientProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    token: 'storybook-reset-token',
    titleId: 'reset-password-title',
  },
};

export const CustomSubmitLabel: Story = {
  args: {
    token: 'storybook-reset-token',
    titleId: 'reset-password-title',
    submitLabel: 'Save new password',
  },
};

export const WithSuccessCallback: Story = {
  args: {
    token: 'storybook-reset-token',
    titleId: 'reset-password-title',
    onSuccess: action('onSuccess called'),
  },
};
